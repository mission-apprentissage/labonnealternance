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
  })
  .passthrough()

const ZEnedisJobDescriptionCustomFields = z
  .object({
    datetime1: z.string().nullish(),
    LongText1: z.union([z.string(), ZXmlAttr]).nullish(),
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

const ZEnedisJobDescription = z
  .object({
    title: z.string(),
    description: z.string().nullish(),
    missionDescription: z.string().nullish(),
    applicantProfile: z.string().nullish(),
    contract: ZEnedisContract,
    contractLength: z.coerce.string().nullish(),
    location: ZEnedisJobLocation.nullish(),
    customFields: ZEnedisJobDescriptionCustomFields.nullish(),
  })
  .passthrough()

const ZEnedisApplicantCriteria = z
  .object({
    diploma: ZEnedisDiploma,
  })
  .passthrough()
  .nullish()

export const ZEnedisJob = z
  .object({
    id: z.coerce.string(),
    reference: z.string(),
    creationDate: z.string().nullish(),
    modificationDate: z.string().nullish(),
    entity: z.union([z.string(), ZXmlAttr]).nullish(),
    beginningDate: z.string().nullish(),
    directUrl: z.string().nullish(),
    jobDescription: ZEnedisJobDescription,
    applicantCriteria: ZEnedisApplicantCriteria,
  })
  .passthrough()

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
  if (code.includes("CAP") || code.includes("BEP")) return "3"
  if (code === "BAC" || code === "BAC_PRO") return "4"
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

export const enedisJobToJobsPartners = (job: IEnedisJob): IComputedJobsPartners => {
  const { id, reference, creationDate, modificationDate, entity, beginningDate, directUrl, jobDescription, applicantCriteria } = job

  const { title, description, missionDescription, applicantProfile, contract, contractLength, location, customFields } = jobDescription

  // Determine contract type from the xml2js parsed value
  let business_error: string | null = null
  let contract_type: ("Apprentissage" | "Professionnalisation")[] = []
  const contractText = getXmlTextValue(contract)
  if (contractText === "Alternance") {
    contract_type = [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]
  } else {
    business_error = JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }

  const contract_duration = contractLength ? parseInt(contractLength, 10) || null : null

  const diplomaClientcode = applicantCriteria?.diploma?.$?.clientcode ?? null
  const european = diplomaClientcodeToEuropean(diplomaClientcode)
  const offer_target_diploma = european ? { european, label: NIVEAU_DIPLOME_LABEL[european] } : null

  const cityRaw = location?.jobLocation?.trim() ?? null
  const workplace_address_city = cityRaw || null

  // Build description by combining available fields
  const descriptionParts: string[] = []
  if (description) descriptionParts.push(description)
  if (missionDescription && missionDescription !== description) descriptionParts.push(`Mission :\n\n${missionDescription}`)
  if (applicantProfile) descriptionParts.push(`Profil recherché :\n\n${applicantProfile}`)
  const offer_description = descriptionParts.join("\n\n").trim() || null

  // Dates
  const now = new Date()
  const publicationDate = parseEnedisDate(creationDate) ?? now
  const offer_expiration = dayjs(parseEnedisDate(modificationDate) ?? publicationDate)
    .tz()
    .add(2, "months")
    .toDate()

  // Contract start from customFields datetime1 or beginningDate
  const customDatetime1 = typeof customFields?.datetime1 === "string" ? customFields.datetime1 : null
  const contractStartRaw = customDatetime1 ?? (beginningDate && beginningDate.trim() ? beginningDate.trim() : null)
  const contract_start = parseEnedisShortDate(contractStartRaw) ?? parseEnedisDate(beginningDate)

  const entityName = getXmlTextValue(entity) ?? "Enedis"
  const urlParsing = z.string().url().safeParse(directUrl)

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(publicationDate),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.ENEDIS,
    partner_job_id: reference ?? id,
    offer_title: title,
    offer_description,
    offer_creation: publicationDate,
    offer_expiration,
    workplace_name: entityName,
    workplace_address_city,
    workplace_address_label: workplace_address_city,
    apply_url: urlParsing.data ?? null,
    contract_type,
    contract_duration,
    contract_start,
    offer_target_diploma,
    offer_multicast: true,
    business_error,
  }
  return partnerJob
}
