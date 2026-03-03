import { ObjectId } from "bson"
import { toInteger } from "lodash-es"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import z from "zod"
import { TRAINING_REMOTE_TYPE } from "shared/constants/recruteur"
import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"
import { getCodePostalFromInsee } from "@/services/referentiel/commune/commune.referentiel.service"

export const ZApecJob = z.object({
  Reference_apec: z.string(),
  Date_parution: z.string().transform((val, ctx) => {
    // format : "DD/MM/YYYY HH:mm:ss" in Europe/Paris timezone
    const parsed = dayjs.tz(val, "DD/MM/YYYY HH:mm:ss", "Europe/Paris")
    if (!parsed.isValid()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid date: ${val}` })
      return z.NEVER
    }
    return parsed.toDate()
  }),
  Teletravail: z.string().nullish(),
  Intitule: z.string(),
  Nombre_postes: z.string(),
  Contrat: z.object({
    Type_contrat: z.string(),
    Duree_contrat: z.string(),
  }),
  Statut: z.string(),
  Niveau_experience: z.string(),
  Salaire_affiche: z.string(),
  Fonction: z
    .object({
      JOB_fonction: z.string().nullish(),
      Libelle_fonction: z.string().nullish(),
    })
    .nullish(),
  Secteur_activite: z.object({
    NAF_secteur: z.string(),
    Libelle_secteur: z.string(),
  }),
  Texte_offre: z.string(),
  Reference_client: z.string().nullish(),
  Nom_entreprise: z.string(),
  Logo_entreprise: z.string().nullish(),
  URL: z.string(),
  Zone_deplacement: z.string().nullable(),
  Lieu: z.object({
    COG_lieu: z.string(),
    Libelle_lieu: z.string(),
  }),
})
export type IApecJob = z.infer<typeof ZApecJob>

export const apecJobToJobsPartners = async (job: IApecJob): Promise<IComputedJobsPartners> => {
  const now = new Date()
  let businessError: null | JOB_PARTNER_BUSINESS_ERROR = null
  const contractDuration = getContratDuration(job.Contrat)
  const codePostal = await getCodePostalFromInsee(job.Lieu.COG_lieu)

  if (contractDuration !== null && contractDuration < 6) {
    businessError = JOB_PARTNER_BUSINESS_ERROR.STAGE
  }

  if (job.Texte_offre.length < 30) {
    businessError = JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }

  if (job.Intitule.length < 3) {
    businessError = JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(now),
    _id: new ObjectId(),
    partner_job_id: job.Reference_apec,
    partner_label: JOBPARTNERS_LABEL.APEC,
    contract_type: getContratType(job.Contrat),
    contract_duration: contractDuration,
    contract_remote: getContratRemote(job.Teletravail),
    offer_title: job.Intitule,
    offer_description: job.Texte_offre,
    offer_creation: dayjs(job.Date_parution).tz().toDate(),
    offer_expiration: dayjs(job.Date_parution).tz().add(2, "months").toDate(),
    offer_opening_count: toInteger(job.Nombre_postes),
    offer_multicast: false,
    workplace_name: job.Nom_entreprise,
    workplace_address_label: `${job.Lieu.Libelle_lieu} ${codePostal ?? ""}`.trim(),
    workplace_address_zipcode: codePostal,
    workplace_address_city: job.Lieu.Libelle_lieu,
    workplace_naf_code: job.Secteur_activite.NAF_secteur,
    workplace_naf_label: job.Secteur_activite.Libelle_secteur,
    apply_url: job.URL,
    business_error: businessError,
  }

  return partnerJob
}

const getContratType = (contrat: IApecJob["Contrat"]): IComputedJobsPartners["contract_type"] => {
  const type = contrat.Type_contrat.toLowerCase()

  if (type.includes("apprentissage")) {
    return ["Apprentissage"]
  }

  if (type.includes("professionnalisation")) {
    return ["Professionnalisation"]
  }

  // Fallback: preserve previous behavior where any non-exact apprenticeship string
  // was treated as "Apprentissage"
  return ["Apprentissage"]
}

const getContratDuration = (contrat: IApecJob["Contrat"]): number | null => {
  const rawDuration = contrat.Duree_contrat?.trim()
  if (!rawDuration) {
    return null
  }
  const parsedDuration = Number.parseInt(rawDuration, 10)
  if (Number.isNaN(parsedDuration)) {
    return null
  }
  return parsedDuration
}

const getContratRemote = (teletravail: IApecJob["Teletravail"]): IComputedJobsPartners["contract_remote"] => {
  if (!teletravail) {
    return null
  }

  if (teletravail.includes("Pas de télétravail autorisé")) {
    return TRAINING_REMOTE_TYPE.onsite
  }

  if (teletravail.includes("Télétravail ponctuel autorisé") || teletravail.includes("Télétravail partiel possible")) {
    return TRAINING_REMOTE_TYPE.hybrid
  }

  if (teletravail.includes("Télétravail total possible")) {
    return TRAINING_REMOTE_TYPE.remote
  }

  return null
}
