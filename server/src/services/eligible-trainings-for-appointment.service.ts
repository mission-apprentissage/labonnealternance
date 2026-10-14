import { badRequest, internal, notFound } from "@hapi/boom"
import type { Filter, ObjectId } from "mongodb"
import type { IEligibleTrainingsForAppointment, IFormationCatalogue } from "shared"
import { BusinessErrorCodes } from "shared/constants/error-codes"
import { ReferrerApiEnum } from "shared/constants/referers"
import type { IAppointmentRequestContextCreateResponseSchema } from "shared/routes/appointments.routes"
import type {
  APPOINTMENT_LINKS_REFERRERS,
  IAppointMentResponseAvailable,
  IAppointmentContextAPI,
  IAppointmentLink,
  IAppointmentResponseSchema,
} from "shared/routes/v2/appointments.routes.v2"
import { logger } from "@/common/logger"
import { isValidEmail } from "@/common/utils/is-valid-email"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { trackApiCall } from "@/common/utils/send-tracking-event"
import config from "@/config"
import { isEmailBlacklisted } from "./application.service"
import { getMostFrequentEmailByGestionnaireSiret } from "./formation.service"
import { getReferrerByKeyName } from "./referrers.service"
import { loadRomeLabelByCode } from "./search/search-items.service"
import { buildEmploiUrl, buildFormationEmploiUrl } from "./training-links.service"

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

      logger.info(
        {
          eligibleTrainingsForAppointmentId: eligibleTrainingsForAppointment._id,
          lieu_formation_email: disabledEmail,
        },
        'Eligible training disabled for "hard_bounce" reason'
      )
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
    return null
  }

  return await getDbCollection("eligible_trainings_for_appointments").findOne({
    cle_ministere_educatif: referentielOnisepIdActionFormation.cle_ministere_educatif,
  })
}

const buildRdvaUrl = (referrerName: string, cleMinistereEducatif: string) =>
  `${config.publicUrl}/rdva?referrer=${referrerName.toLowerCase()}&cleMinistereEducatif=${encodeURIComponent(cleMinistereEducatif)}`

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

  // tracking v1 pour décommissionnement
  await trackApiCall({ caller: referrerObj.name, api_path: "v1:/appointment-request/context/create", response: "tracking-v1" })

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
    return { error: "Prise de rendez-vous non disponible." }
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
    intitule_long: eligibleTrainingsForAppointment.training_intitule_long ?? null,
    lieu_formation_adresse: eligibleTrainingsForAppointment.lieu_formation_street,
    code_postal: eligibleTrainingsForAppointment.lieu_formation_zip_code,
    etablissement_formateur_siret: etablissement.formateur_siret,
    cfd: eligibleTrainingsForAppointment.training_code_formation_diplome,
    localite: eligibleTrainingsForAppointment.lieu_formation_city,
    id_rco_formation: eligibleTrainingsForAppointment.rco_formation_id,
    cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
    form_url: `${config.publicUrl}/rdva?referrer=${referrerName.toLowerCase()}&cleMinistereEducatif=${encodeURIComponent(eligibleTrainingsForAppointment.cle_ministere_educatif)}`,
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
    intitule_long: eligibleTrainingsForAppointment.training_intitule_long ?? null,
    lieu_formation_adresse: eligibleTrainingsForAppointment.lieu_formation_street,
    code_postal: eligibleTrainingsForAppointment.lieu_formation_zip_code,
    etablissement_formateur_siret: etablissement.formateur_siret ?? null,
    cfd: eligibleTrainingsForAppointment.training_code_formation_diplome,
    localite: eligibleTrainingsForAppointment.lieu_formation_city,
    cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
    form_url: buildRdvaUrl(referrerObj.name, eligibleTrainingsForAppointment.cle_ministere_educatif),
  }
}

export const findElligibleTrainingForAppointmentPrivate = async (referrer: string, cleMinistereEducatif: string): Promise<IAppointMentResponseAvailable> => {
  const referrerObj = getReferrerByKeyName(referrer)
  const eligibleTrainingsForAppointment = await findEligibleTrainingByMinisterialKey(cleMinistereEducatif)

  if (!eligibleTrainingsForAppointment) {
    throw notFound(BusinessErrorCodes.TRAINING_NOT_FOUND)
  }

  if (!isOpenForAppointments(eligibleTrainingsForAppointment, referrerObj.name)) {
    throw badRequest("Training not available for appointments")
  }

  const etablissement = await findEtablissement(eligibleTrainingsForAppointment.etablissement_formateur_siret)

  if (!etablissement) {
    throw badRequest("Training establishment not found")
  }

  return {
    etablissement_formateur_entreprise_raison_sociale: etablissement.raison_sociale,
    intitule_long: eligibleTrainingsForAppointment.training_intitule_long ?? null,
    lieu_formation_adresse: eligibleTrainingsForAppointment.lieu_formation_street,
    code_postal: eligibleTrainingsForAppointment.lieu_formation_zip_code,
    etablissement_formateur_siret: etablissement.formateur_siret ?? null,
    cfd: eligibleTrainingsForAppointment.training_code_formation_diplome,
    localite: eligibleTrainingsForAppointment.lieu_formation_city,
    cle_ministere_educatif: eligibleTrainingsForAppointment.cle_ministere_educatif,
    form_url: buildRdvaUrl(referrerObj.name, eligibleTrainingsForAppointment.cle_ministere_educatif),
  }
}

type IAppointmentLinksReferrer = (typeof APPOINTMENT_LINKS_REFERRERS)[number]

// Même critère d'éligibilité que isOpenForAppointments, appliqué en masse.
export const getAppointmentLinks = async (referrer: IAppointmentLinksReferrer): Promise<IAppointmentLink[]> => {
  const referrerObj = getReferrerByKeyName(referrer)
  const trainings = await getDbCollection("eligible_trainings_for_appointments")
    .find(
      { referrers: referrerObj.name, lieu_formation_email: { $nin: [null, ""] } },
      { projection: { _id: 0, cle_ministere_educatif: 1, parcoursup_id: 1, training_intitule_long: 1, etablissement_formateur_siret: 1 } }
    )
    .toArray()
  const cles = trainings.map((training) => training.cle_ministere_educatif)
  const sirets = [...new Set(trainings.map((training) => training.etablissement_formateur_siret).filter((siret) => siret != null))]

  const [formations, romeLabelByCode, onisepIdsByCle, knownSirets] = await Promise.all([
    getDbCollection("formationcatalogues")
      .find(
        { cle_ministere_educatif: { $in: cles } },
        { projection: { _id: 0, cle_ministere_educatif: 1, localite: 1, intitule_long: 1, lieu_formation_geopoint: 1, rome_codes: 1 } }
      )
      .toArray(),
    loadRomeLabelByCode(),
    referrer === ReferrerApiEnum.ONISEP ? getOnisepIdsByCle(cles) : new Map<string, string[]>(),
    getDbCollection("etablissements").distinct("formateur_siret", { formateur_siret: { $in: sirets } }),
  ])
  const siretSet = new Set<unknown>(knownSirets)
  const formationByCle = new Map(formations.map((formation) => [formation.cle_ministere_educatif as string, formation as IFormationCatalogue]))
  const trackingParams = { search_source: "partner_links", utm_source: referrer }

  const links = trainings.flatMap(({ cle_ministere_educatif, parcoursup_id, training_intitule_long, etablissement_formateur_siret }) => {
    // Sans établissement formateur, POST /v2/appointment répond 500 : formation exclue du lot.
    if (!siretSet.has(etablissement_formateur_siret)) return []
    const ids = getPartnerIds(referrer, { cle_ministere_educatif, parcoursup_id }, onisepIdsByCle)
    if (!ids.length) return []

    const formation = formationByCle.get(cle_ministere_educatif)
    const url_emploi = formation
      ? buildFormationEmploiUrl(formation, romeLabelByCode, trackingParams)
      : buildEmploiUrl({ params: { q: training_intitule_long, ...trackingParams } })
    const url_rdva = buildRdvaUrl(referrerObj.name, cle_ministere_educatif)
    return ids.map((id) => ({ id, url_rdva, url_emploi }))
  })

  return links.sort((a, b) => a.id.localeCompare(b.id) || a.url_rdva.localeCompare(b.url_rdva))
}

const getPartnerIds = (
  referrer: IAppointmentLinksReferrer,
  training: Pick<IEligibleTrainingsForAppointment, "cle_ministere_educatif" | "parcoursup_id">,
  onisepIdsByCle: Map<string, string[]>
): string[] => {
  switch (referrer) {
    case ReferrerApiEnum.PARCOURSUP:
      return training.parcoursup_id ? [training.parcoursup_id] : []
    case ReferrerApiEnum.ONISEP:
      return onisepIdsByCle.get(training.cle_ministere_educatif) ?? []
    case ReferrerApiEnum.AFFELNET:
      return [training.cle_ministere_educatif]
  }
}

const getOnisepIdsByCle = async (cles: string[]): Promise<Map<string, string[]>> => {
  const mappings = await getDbCollection("referentieloniseps")
    .find({ cle_ministere_educatif: { $in: cles } }, { projection: { _id: 0, id_action_ideo2: 1, cle_ministere_educatif: 1 } })
    .toArray()
  const idsByCle = new Map<string, string[]>()
  for (const { cle_ministere_educatif, id_action_ideo2 } of mappings) {
    idsByCle.set(cle_ministere_educatif, [...new Set([...(idsByCle.get(cle_ministere_educatif) ?? []), id_action_ideo2])])
  }
  return idsByCle
}
