import { badRequest, internal, notFound } from "@hapi/boom"
import { Filter, ObjectId } from "mongodb"
import { IEligibleTrainingsForAppointment, IFormationCatalogue } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { IAppointmentRequestContextCreateResponseSchema } from "shared/routes/appointments.routes"
import { IAppointmentContextAPI, IAppointmentResponseSchema } from "shared/routes/v2/appointments.routes.v2"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"

import { isValidEmail } from "../common/utils/isValidEmail"

import { isEmailBlacklisted } from "./application.service"
import { getMostFrequentEmailByGestionnaireSiret } from "./formation.service"
import { getReferrerByKeyName } from "./referrers.service"

export const find = (conditions: Filter<IEligibleTrainingsForAppointment>, options = {}) =>
  getDbCollection("eligible_trainings_for_appointments").find(conditions, options).toArray()

export const findOne = (conditions: Filter<IEligibleTrainingsForAppointment>, options = {}) => getDbCollection("eligible_trainings_for_appointments").findOne(conditions, options)

export const updateParameter = (id: ObjectId, params: Partial<IEligibleTrainingsForAppointment>) =>
  getDbCollection("eligible_trainings_for_appointments").findOneAndUpdate({ _id: id }, params, { returnDocument: "after" })

export const findOneAndUpdate = (conditions: Filter<IEligibleTrainingsForAppointment>, values) =>
  getDbCollection("eligible_trainings_for_appointments").findOneAndUpdate(conditions, { $set: values }, { returnDocument: "after", upsert: true })

export const getParameterByCleMinistereEducatif = ({ cleMinistereEducatif }) =>
  getDbCollection("eligible_trainings_for_appointments").findOne({ cle_ministere_educatif: cleMinistereEducatif })

export const getEmailForRdv = async (
  formation: Pick<IFormationCatalogue, "email" | "etablissement_gestionnaire_courriel" | "etablissement_gestionnaire_siret">,
  type: "email" | "etablissement_gestionnaire_courriel" = "email"
): Promise<string | null> => {
  const { email, etablissement_gestionnaire_courriel, etablissement_gestionnaire_siret } = formation
  if (email && isValidEmail(email) && !(await isEmailBlacklisted(email))) return email
  if (etablissement_gestionnaire_courriel && isValidEmail(etablissement_gestionnaire_courriel) && !(await isEmailBlacklisted(etablissement_gestionnaire_courriel))) {
    return etablissement_gestionnaire_courriel
  } else {
    return await getMostFrequentEmailByGestionnaireSiret(etablissement_gestionnaire_siret ?? undefined, type)
  }
}

export const disableEligibleTraininForAppointmentWithEmail = async (disabledEmail: string) => {
  const eligibleTrainingsForAppointmentsWithEmail = await find({ lieu_formation_email: disabledEmail })

  await Promise.all(
    eligibleTrainingsForAppointmentsWithEmail.map(async (eligibleTrainingsForAppointment) => {
      await getDbCollection("eligible_trainings_for_appointments").updateOne({ _id: eligibleTrainingsForAppointment._id }, { $set: { referrers: [], lieu_formation_email: "" } })

      logger.info('Eligible training disabled for "hard_bounce" reason', {
        eligibleTrainingsForAppointmentId: eligibleTrainingsForAppointment._id,
        lieu_formation_email: disabledEmail,
      })
    })
  )
}

const findEligibleTrainingByMinisterialKey = async (idCleMinistereEducatif: string) => {
  return await getDbCollection("eligible_trainings_for_appointments").findOne({ cle_ministere_educatif: idCleMinistereEducatif })
}

const findEligibleTrainingByParcoursupId = async (idParcoursup: string) => {
  return await getDbCollection("eligible_trainings_for_appointments").findOne({ parcoursup_id: idParcoursup })
}

const findEligibleTrainingByActionFormation = async (idActionFormation: string) => {
  const referentielOnisepIdActionFormation = await getDbCollection("referentieloniseps").findOne({ id_action_ideo2: idActionFormation })

  if (!referentielOnisepIdActionFormation) {
    throw notFound("Training not found")
  }

  return await getDbCollection("eligible_trainings_for_appointments").findOne({
    cle_ministere_educatif: referentielOnisepIdActionFormation.cle_ministere_educatif,
  })
}

function isOpenForAppointments(eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment, referrerName: string) {
  return eligibleTrainingsForAppointment.referrers.includes(referrerName) && eligibleTrainingsForAppointment.lieu_formation_email
}

const findEtablissement = async (formateurSiret: string | null | undefined) => {
  return await getDbCollection("etablissements").findOne({ formateur_siret: formateurSiret })
}

export const findElligibleTrainingForAppointment = async ({
  idCleMinistereEducatif,
  idParcoursup,
  idActionFormation,
  referrer,
}: {
  idCleMinistereEducatif?: string
  idParcoursup?: string
  idActionFormation?: string
  referrer: string
}): Promise<IAppointmentRequestContextCreateResponseSchema> => {
  const referrerObj = getReferrerByKeyName(referrer)
  let eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment | null

  if (idCleMinistereEducatif) {
    eligibleTrainingsForAppointment = await findEligibleTrainingByMinisterialKey(idCleMinistereEducatif)
  } else if (idParcoursup) {
    eligibleTrainingsForAppointment = await findEligibleTrainingByParcoursupId(idParcoursup)
  } else if (idActionFormation) {
    eligibleTrainingsForAppointment = await findEligibleTrainingByActionFormation(idActionFormation)
  } else {
    throw badRequest("Critère de recherche non conforme.")
  }

  return await getAppointmentContext(eligibleTrainingsForAppointment, referrerObj.name)
}

const getAppointmentContext = async (
  eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment | null,
  referrerName: string
): Promise<IAppointmentRequestContextCreateResponseSchema> => {
  if (!eligibleTrainingsForAppointment) {
    throw notFound(BusinessErrorCodes.TRAINING_NOT_FOUND)
  }
  if (!isOpenForAppointments(eligibleTrainingsForAppointment, referrerName)) {
    return {
      error: "Prise de rendez-vous non disponible.",
    }
  }

  const etablissement = await findEtablissement(eligibleTrainingsForAppointment.etablissement_formateur_siret)

  if (!etablissement) {
    throw internal("Etablissement formateur non trouvé")
  }

  return {
    etablissement_formateur_entreprise_raison_sociale: etablissement.raison_sociale,
    intitule_long: eligibleTrainingsForAppointment.training_intitule_long,
    lieu_formation_adresse: eligibleTrainingsForAppointment.lieu_formation_street,
    code_postal: eligibleTrainingsForAppointment.lieu_formation_zip_code,
    etablissement_formateur_siret: etablissement.formateur_siret,
    cfd: eligibleTrainingsForAppointment.training_code_formation_diplome,
    localite: eligibleTrainingsForAppointment.lieu_formation_city,
    id_rco_formation: eligibleTrainingsForAppointment.rco_formation_id,
    cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
    form_url: `${config.publicUrl}/espace-pro/form?referrer=${referrerName.toLowerCase()}&cleMinistereEducatif=${encodeURIComponent(
      eligibleTrainingsForAppointment.cle_ministere_educatif
    )}`,
  }
}

export const findElligibleTrainingForAppointmentV2 = async (context: IAppointmentContextAPI): Promise<IAppointmentResponseSchema> => {
  const { referrer } = context
  const referrerObj = getReferrerByKeyName(referrer)
  let eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment | null = null

  if ("cle_ministere_educatif" in context) {
    eligibleTrainingsForAppointment = await findEligibleTrainingByMinisterialKey(context.cle_ministere_educatif)
  } else if ("parcoursup_id" in context) {
    eligibleTrainingsForAppointment = await findEligibleTrainingByParcoursupId(context.parcoursup_id)
  } else if ("onisep_id" in context) {
    eligibleTrainingsForAppointment = await findEligibleTrainingByActionFormation(context.onisep_id)
  }

  if (!eligibleTrainingsForAppointment) {
    throw notFound("Training not found")
  }

  if (!isOpenForAppointments(eligibleTrainingsForAppointment, referrerObj.name)) {
    return {
      error: "Appointment request not available",
    }
  }

  const etablissement = await findEtablissement(eligibleTrainingsForAppointment.etablissement_formateur_siret)

  if (!etablissement) {
    throw internal("Training establishment not found")
  }

  return {
    etablissement_formateur_entreprise_raison_sociale: etablissement.raison_sociale,
    intitule_long: eligibleTrainingsForAppointment.training_intitule_long,
    lieu_formation_adresse: eligibleTrainingsForAppointment.lieu_formation_street,
    code_postal: eligibleTrainingsForAppointment.lieu_formation_zip_code,
    etablissement_formateur_siret: etablissement.formateur_siret ?? null,
    cfd: eligibleTrainingsForAppointment.training_code_formation_diplome,
    localite: eligibleTrainingsForAppointment.lieu_formation_city,
    cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
    form_url: `${config.publicUrl}/espace-pro/form?referrer=${referrerObj.name.toLowerCase()}&cleMinistereEducatif=${encodeURIComponent(
      eligibleTrainingsForAppointment.cle_ministere_educatif
    )}`,
  }
}
