import { ObjectId } from "mongodb"
import { NIVEAU_DIPLOME_LABEL, TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"

// xml2js stores attributes under '$' and text content under '_'
const ZXmlAttr = z.object({ $: z.record(z.string()).nullish() }).passthrough()

const ZEnedisJobLocation = z
  .object({
    jobLocation: z.string().nullish(),
    departements: z
      .object({
        departement: z.union([z.string(), ZXmlAttr, z.array(z.union([z.string(), ZXmlAttr]))]).nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough()

const ZEnedisJobDescriptionCustomFields = z
  .object({
    datetime1: z.union([z.string(), ZXmlAttr]).nullish(),
    LongText1: z.union([z.string(), ZXmlAttr]).nullish(),
    LongText1Formatted: z.union([z.string(), ZXmlAttr]).nullish(),
  })
  .passthrough()

const ZEnedisContract = z
  .union([
    z.string(),
    z
      .object({
        _: z.string().nullish(),
        $: z.object({ clientcode: z.string().nullish() }).passthrough().nullish(),
      })
      .passthrough(),
  ])
  .nullish()

const ZEnedisDiploma = z
  .object({
    $: z.object({ clientcode: z.string().nullish() }).passthrough().nullish(),
  })
  .passthrough()
  .nullish()

const ZEnedisSpecialisationOuter = z
  .object({
    specialisation: z.union([z.string(), ZXmlAttr]).nullish(),
  })
  .passthrough()

const ZEnedisJobDescription = z
  .object({
    title: z.string(),
    description: z.string(),
    missionDescription: z.string().nullish(),
    missionDescriptionFormatted: z.string().nullish(),
    applicantProfile: z.string().nullish(),
    applicantProfileFormatted: z.string().nullish(),
    contract: ZEnedisContract,
    contractLength: z.coerce.string().nullish(),
    location: ZEnedisJobLocation.nullish(),
    customFields: ZEnedisJobDescriptionCustomFields.nullish(),
  })
  .passthrough()

const ZEnedisApplicantCriteria = z
  .object({
    diploma: ZEnedisDiploma,
    customFields: z
      .object({
        list1: z.union([z.string(), ZXmlAttr]).nullish(), // Used for remuneration in the mapper
      })
      .passthrough()
      .nullish(),
    specialisations: z
      .object({
        specialisation: z.union([ZEnedisSpecialisationOuter, z.array(ZEnedisSpecialisationOuter)]).nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough()
  .nullish()

const ZEnedisSupervisor = z.object({
  FullName: z.string().nullish(),
  Name: z.string().nullish(),
  FirstName: z.string().nullish(),
  Email: z.string().nullish(),
  PhoneNumber: z.string().nullish(),
})

export const ZEnedisJob = z.object({
  id: z.coerce.string(),
  reference: z.string(),
  entityDescription: z.string().nullish(),
  origin: z.any().nullish(),
  customFields: z.any().nullish(),
  creationDate: z.string().nullish(),
  modificationDate: z.string().nullish(),
  entity: z.union([z.string(), ZXmlAttr]).nullish(),
  entityAdress: z.any().nullish(),
  beginningDate: z.string().nullish(),
  directUrl: z.string().nullish(),
  UrlRedirectionApplicant: z.string().nullish(),
  mainSupervisor: ZEnedisSupervisor.nullish(),
  jobDescription: ZEnedisJobDescription,
  applicantCriteria: ZEnedisApplicantCriteria,
})

export type IEnedisJob = z.output<typeof ZEnedisJob>

/**
 * Parse a date in YYYYMMDD format (ex: "20260224") to a Date object.
 */
const parseEnedisDate = (raw: string | null | undefined): Date | null => {
  if (!raw || raw.length !== 8) return null
  const year = parseInt(raw.slice(0, 4), 10)
  const month = parseInt(raw.slice(4, 6), 10) - 1
  const day = parseInt(raw.slice(6, 8), 10)
  const date = new Date(year, month, day)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Parse a date in DD/MM/YYYY format (ex: "01/09/2026") to a Date object.
 */
const parseEnedisShortDate = (raw: string | null | undefined): Date | null => {
  if (!raw) return null
  const parts = raw.trim().split("/")
  if (parts.length !== 3) return null
  const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Map Enedis diploma clientcode to european diploma level.
 * Codes observed in the Enedis XML feed:
 *  - CAP_BEP           -> "3"  (Cap, infrabac)
 *  - BAC_PRO           -> "4"  (Bac)
 *  - BAC               -> "4"  (Bac)
 *  - BAC2_BAC3         -> "5"  (BTS/DUT, bac+2)
 *  - BAC2              -> "5"
 *  - BAC3              -> "6"  (Licence, bac+3)
 *  - BAC3_BAC5         -> "6"
 *  - BAC4_BAC5         -> "7"  (Master, bac+5)
 *  - BAC5              -> "7"
 */
const diplomaClientcodeToEuropean = (clientcode: string | null | undefined): "3" | "4" | "5" | "6" | "7" | null => {
  if (!clientcode) return null
  const code = clientcode.toUpperCase()
  if (code === "BAC" || code === "BAC_PRO" || code === "CAP_BEP_BAC") return "4"
  if (code.includes("CAP") || code.includes("BEP") || code === "SANS_DIPLOME") return "3"
  if (code.startsWith("BAC2") || code === "BAC2_BAC3") return "5"
  if (code.startsWith("BAC3") || code === "BAC3_BAC5") return "6"
  if (code.startsWith("BAC4") || code.startsWith("BAC5") || code === "BAC4_BAC5") return "7"
  return null
}

/**
 * Extract text value from an xml2js element that may be:
 *   - a plain string: "Alternance"
 *   - an object with attributes: { $: { clientcode: "CONTRAT_ALTERNANCE" }, _: "Alternance" }
 */
const getXmlTextValue = (value: unknown): string | null => {
  if (!value) return null
  if (typeof value === "string") return value
  if (typeof value === "object" && "_" in value && typeof (value as Record<string, unknown>)._ === "string") {
    return (value as Record<string, string>)._
  }
  return null
}

export const enedisJobToJobsPartnersProcessor = (job: IEnedisJob, partnerLabel: JOBPARTNERS_LABEL): IComputedJobsPartners => {
  const { id, creationDate, entityDescription, modificationDate, directUrl, jobDescription, applicantCriteria, mainSupervisor } = job

  const { title, description, missionDescription, missionDescriptionFormatted, applicantProfile, applicantProfileFormatted, contract, contractLength, location, customFields } =
    jobDescription

  // Determine contract type from the xml2js parsed value
  let business_error: string | null = null
  let contract_type: ("Apprentissage" | "Professionnalisation")[] = []
  const contractText = getXmlTextValue(contract)
  switch (contractText) {
    case "Alternance":
      contract_type = [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]
      break
    case "Stage":
      business_error = JOB_PARTNER_BUSINESS_ERROR.STAGE
      break
    case "CDI":
    case "CDD":
      business_error = JOB_PARTNER_BUSINESS_ERROR.FULL_TIME
      break
    default:
      business_error = JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }

  if (!title || title.length < 3) {
    business_error = business_error ?? JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }

  // exclusion du flux edf des offres enedis
  if (mainSupervisor?.Email?.includes("enedis.fr") && partnerLabel !== JOBPARTNERS_LABEL.ENEDIS) {
    business_error = JOB_PARTNER_BUSINESS_ERROR.TRUSTED_COMPANY_JOB_DUPLICATE
  }

  const contract_duration = contractLength ? parseInt(contractLength, 10) || null : null

  const diplomaClientcode = applicantCriteria?.diploma?.$?.clientcode ?? null
  const european = diplomaClientcodeToEuropean(diplomaClientcode)
  const offer_target_diploma = european ? { european, label: NIVEAU_DIPLOME_LABEL[european] } : null

  const cityRaw = location?.jobLocation?.trim() ?? null
  const workplace_address_city = cityRaw || null

  const workplace_address_label = workplace_address_city

  // Build description by combining available fields
  const descriptionParts: string[] = []
  if (missionDescriptionFormatted || missionDescription || description) {
    descriptionParts.push(/*missionDescriptionFormatted ?? */ missionDescription ?? description)
  }

  if (applicantProfileFormatted || applicantProfile) {
    descriptionParts.push(`Profil recherché :\n\n${/*applicantProfileFormatted ?? */ applicantProfile}`)
  }

  const remuneration = getXmlTextValue(applicantCriteria?.customFields?.list1) ?? null
  if (remuneration) {
    descriptionParts.push(`Rémunération : ${remuneration}`)
  }

  const longText1 = getXmlTextValue(customFields?.LongText1) ?? null
  if (longText1) {
    descriptionParts.push(longText1)
  }

  const offer_description = descriptionParts.join("\n\n").trim() || null

  if (!offer_description || offer_description.length < 30) {
    business_error = business_error ?? JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }

  // Extract specialisations for offer_desired_skills
  // XML structure: specialisations.specialisation[*].specialisation (inner specialisation holds text)
  const rawSpecialisations = applicantCriteria?.specialisations?.specialisation
  const outerList = rawSpecialisations ? (Array.isArray(rawSpecialisations) ? rawSpecialisations : [rawSpecialisations]) : []
  const offer_to_be_acquired_skills = outerList
    .map((outer) => {
      const inner = outer?.specialisation
      return inner ? getXmlTextValue(inner) : null
    })
    .filter((s): s is string => s !== null && s.trim() !== "")

  // Dates
  const now = new Date()
  const publicationDate = parseEnedisDate(creationDate) ?? now
  const offer_expiration = dayjs(parseEnedisDate(modificationDate) ?? publicationDate)
    .tz()
    .add(2, "months")
    .toDate()

  // Contract start from customFields datetime1 or beginningDate
  const dateTime = getXmlTextValue(customFields?.datetime1) ?? null
  const contract_start = dateTime ? parseEnedisShortDate(dateTime) : null

  const urlParsing = z.string().url().safeParse(directUrl)

  const experienceLevel = getXmlTextValue(applicantCriteria?.experienceLevel) ?? null

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(publicationDate),
    _id: new ObjectId(),
    partner_label: partnerLabel,
    partner_job_id: id,
    offer_title: title,
    offer_description,
    offer_creation: publicationDate,
    offer_expiration,
    workplace_name: partnerLabel,
    workplace_address_city,
    workplace_address_label,
    workplace_description: entityDescription || null,
    workplace_naf_code: partnerLabel === JOBPARTNERS_LABEL.ENEDIS ? "35.14Y" : "35.11Z",
    workplace_naf_label: partnerLabel === JOBPARTNERS_LABEL.ENEDIS ? "Distribution d'électricité" : "Production d'électricité",
    apply_url: urlParsing.data ?? null,
    contract_type,
    contract_duration,
    contract_start,
    offer_access_conditions: experienceLevel ? [experienceLevel] : [],
    offer_to_be_acquired_skills,
    offer_target_diploma,
    offer_multicast: true,
    business_error,
  }
  return partnerJob
}

export const enedisJobToJobsPartners = (job: IEnedisJob): IComputedJobsPartners => {
  return enedisJobToJobsPartnersProcessor(job, JOBPARTNERS_LABEL.ENEDIS)
}
