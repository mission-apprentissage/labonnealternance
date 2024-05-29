import Boom from "boom"
import type { ObjectId } from "mongodb"
import type { FilterQuery } from "mongoose"
import { IEligibleTrainingsForAppointment, IFormationCatalogue } from "shared"
import { IAppointmentRequestContextCreateResponseSchema } from "shared/routes/appointments.routes"

import { logger } from "@/common/logger"
import { getReferrerByKeyName } from "@/common/model/constants/referrers"
import config from "@/config"

import { EligibleTrainingsForAppointment, Etablissement, ReferentielOnisep } from "../common/model/index"
import { isValidEmail } from "../common/utils/isValidEmail"

import { isEmailBlacklisted } from "./application.service"
import { getMostFrequentEmailByGestionnaireSiret } from "./formation.service"

export const create = (params: Partial<IEligibleTrainingsForAppointment>) => EligibleTrainingsForAppointment.create(params)

export const find = (conditions: FilterQuery<IEligibleTrainingsForAppointment>, options = {}) => EligibleTrainingsForAppointment.find(conditions, options)

export const findOne = (conditions: FilterQuery<IEligibleTrainingsForAppointment>) => EligibleTrainingsForAppointment.findOne(conditions)

export const updateParameter = (id: ObjectId | string, params: Partial<IEligibleTrainingsForAppointment>) =>
  EligibleTrainingsForAppointment.findOneAndUpdate({ _id: id }, params, { new: true })

export const remove = (id: string) => EligibleTrainingsForAppointment.findByIdAndDelete(id)

export const updateMany = (conditions: FilterQuery<IEligibleTrainingsForAppointment>, values) =>
  EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true, upsert: true })

export const update = (conditions: FilterQuery<IEligibleTrainingsForAppointment>, values) => EligibleTrainingsForAppointment.updateMany(conditions, values, { new: true })

export const getParameterByCleMinistereEducatif = ({ cleMinistereEducatif }) => EligibleTrainingsForAppointment.findOne({ cle_ministere_educatif: cleMinistereEducatif }).lean()

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
      await eligibleTrainingsForAppointment.update({ referrers: [], lieu_formation_email: "" })

      logger.info('Eligible training disabled for "hard_bounce" reason', {
        eligibleTrainingsForAppointmentId: eligibleTrainingsForAppointment._id,
        lieu_formation_email: disabledEmail,
      })
    })
  )
}

const findEligibleTrainingByMinisterialKey = async (idCleMinistereEducatif: string) => {
  return await EligibleTrainingsForAppointment.findOne({ cle_ministere_educatif: idCleMinistereEducatif })
}

const findEligibleTrainingByParcoursupId = async (idParcoursup: string) => {
  return await EligibleTrainingsForAppointment.findOne({ parcoursup_id: idParcoursup })
}

const findEligibleTrainingByActionFormation = async (idActionFormation: string) => {
  const referentielOnisepIdActionFormation = await ReferentielOnisep.findOne({ id_action_ideo2: idActionFormation })

  if (!referentielOnisepIdActionFormation) {
    throw Boom.notFound("Formation not found")
  }

  return await EligibleTrainingsForAppointment.findOne({
    cle_ministere_educatif: referentielOnisepIdActionFormation.cle_ministere_educatif,
  })
}

function isOpenForAppointments(eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment, referrerName: string) {
  return eligibleTrainingsForAppointment.referrers.includes(referrerName) && eligibleTrainingsForAppointment.lieu_formation_email
}

const findEtablissement = async (formateurSiret: string | null | undefined) => {
  return await Etablissement.findOne({ formateur_siret: formateurSiret })
}

export const findElligibleTrainingForAppointment = async (req: any): Promise<IAppointmentRequestContextCreateResponseSchema> => {
  const { referrer } = req.body
  const referrerObj = getReferrerByKeyName(referrer)
  let eligibleTrainingsForAppointment: IEligibleTrainingsForAppointment | null

  if ("idCleMinistereEducatif" in req.body) {
    eligibleTrainingsForAppointment = await findEligibleTrainingByMinisterialKey(req.body.idCleMinistereEducatif)
  } else if ("idParcoursup" in req.body) {
    eligibleTrainingsForAppointment = await findEligibleTrainingByParcoursupId(req.body.idParcoursup)
  } else if ("idActionFormation" in req.body) {
    eligibleTrainingsForAppointment = await findEligibleTrainingByActionFormation(req.body.idActionFormation)
  } else {
    throw Boom.badRequest("Critère de recherche non conforme.")
  }

  if (!eligibleTrainingsForAppointment) {
    throw Boom.notFound("Formation introuvable")
  }

  if (!isOpenForAppointments(eligibleTrainingsForAppointment, referrerObj.name)) {
    return {
      error: "Prise de rendez-vous non disponible.",
    }
  }

  const etablissement = await findEtablissement(eligibleTrainingsForAppointment.etablissement_formateur_siret)

  if (!etablissement) {
    throw Boom.internal("Etablissement formateur non trouvé")
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
    form_url: `${config.publicUrl}/espace-pro/form?referrer=${referrerObj.name.toLowerCase()}&cleMinistereEducatif=${encodeURIComponent(
      eligibleTrainingsForAppointment.cle_ministere_educatif
    )}`,
  }
}
