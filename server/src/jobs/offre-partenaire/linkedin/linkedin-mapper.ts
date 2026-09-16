import { ObjectId } from "bson"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import z from "zod"
import { blankComputedJobPartner } from "@/jobs/offre-partenaire/fill-computed-jobs-partners"

// Le flux LinkedIn n'est pas filtré sur l'alternance : sur la première livraison, 9 590 offres
// dont ~13 % seulement relèvent de l'alternance. Aucun champ ne porte le type de contrat
// (employmentStatus vaut FULL_TIME / INTERNSHIP / ENTRY_LEVEL / TEMPORARY / PART_TIME / OTHER /
// VOLUNTEER), la détection se fait donc sur le texte. Tout ce qui ne matche pas est marqué
// FULL_TIME et ne remonte jamais dans jobs_partners.
const ALTERNANCE_REGEX = /\b(alternan\w*|apprenti\w*|professionnalisation|contrat\s+pro)\b/i
const PROFESSIONNALISATION_REGEX = /\b(professionnalisation|contrat\s+pro)\b/i

// Paramètre de tracking imposé par LinkedIn, à ajouter derrière le `trk=` déjà présent dans le flux.
const LINKEDIN_TRACKING_PARAM = "mcid=7503545590606254081"

export const ZLinkedinJob = z.looseObject({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  location: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  postalCode: z.string().nullish(),
  country: z.string().nullish(),
  url: z.string(),
  company: z.string(),
  listDate: z.string(),
  expirationDate: z.string().nullish(),
  linkedinCompanyId: z.string().nullish(),
  linkedinCompanyUrl: z.string().nullish(),
  jobFunction: z.string().nullish(),
  experienceLevel: z.string().nullish(),
  employmentStatus: z.string().nullish(),
  industries: z.string().nullish(),
})

export type ILinkedinJob = z.output<typeof ZLinkedinJob>

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
}

// Format LinkedIn : "September 15, 2026 at 8:14:58 AM UTC". Parsé à la main plutôt qu'avec
// dayjs : le helper partagé force la locale `fr`, les noms de mois anglais ne seraient pas résolus.
export const parseLinkedinDate = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null
  }
  const match = value.trim().match(/^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)\s+UTC$/i)
  if (!match) {
    return null
  }
  const [, monthName, day, year, hour, minute, second, meridiem] = match
  const month = MONTHS[monthName.toLowerCase()]
  if (month === undefined) {
    return null
  }
  let hours = Number.parseInt(hour, 10) % 12
  if (meridiem.toUpperCase() === "PM") {
    hours += 12
  }
  return new Date(Date.UTC(Number.parseInt(year, 10), month, Number.parseInt(day, 10), hours, Number.parseInt(minute, 10), Number.parseInt(second, 10)))
}

// `city` est vide sur une partie des offres ; `location` est toujours renseigné sous la forme
// "Ville, Région, Pays" — on retombe sur son premier segment.
export const getCity = (job: ILinkedinJob): string | null => {
  const city = job.city?.trim()
  if (city) {
    return city
  }
  const firstSegment = job.location?.split(",")[0]?.trim()
  return firstSegment || null
}

// Le flux fournit déjà `trk=`, `utm_medium`, `utm_source` et `ePP` ; seul `mcid` manque.
export const buildApplyUrl = (url: string): string => {
  if (url.includes("mcid=")) {
    return url
  }
  return `${url}${url.includes("?") ? "&" : "?"}${LINKEDIN_TRACKING_PARAM}`
}

export const getContractType = (job: ILinkedinJob): IComputedJobsPartners["contract_type"] => {
  const haystack = `${job.title} ${job.description}`
  return PROFESSIONNALISATION_REGEX.test(haystack) ? [TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION] : [TRAINING_CONTRACT_TYPE.APPRENTISSAGE]
}

const getBusinessError = (job: ILinkedinJob): JOB_PARTNER_BUSINESS_ERROR | null => {
  if (job.title.trim().length < 3 || job.description.trim().length < 30) {
    return JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }
  if (!ALTERNANCE_REGEX.test(`${job.title} ${job.description}`)) {
    return JOB_PARTNER_BUSINESS_ERROR.FULL_TIME
  }
  return null
}

export const linkedinJobToJobsPartners = (job: ILinkedinJob): IComputedJobsPartners => {
  const now = new Date()
  const creationDate = parseLinkedinDate(job.listDate) ?? now
  const city = getCity(job)
  const zipcode = job.postalCode?.trim() || null

  return {
    ...blankComputedJobPartner(now),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.LINKEDIN,
    partner_job_id: job.id,
    offer_title: job.title,
    offer_description: job.description,
    offer_creation: creationDate,
    offer_expiration: parseLinkedinDate(job.expirationDate),
    // Les offres pointent vers linkedin.com : pas de rediffusion vers les autres partenaires.
    offer_multicast: false,
    contract_type: getContractType(job),
    workplace_name: job.company,
    workplace_address_city: city,
    workplace_address_zipcode: zipcode,
    workplace_address_label: [city, zipcode].filter(Boolean).join(" ") || job.location?.trim() || null,
    apply_url: buildApplyUrl(job.url),
    business_error: getBusinessError(job),
  }
}
