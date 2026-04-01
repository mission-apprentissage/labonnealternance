import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL, NIVEAUX_DIPLOMES_EUROPEENS } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"

// xml2js with { explicitArray: false, emptyTag: null } parses XML elements as:
// - text-only element: string
// - empty element: null
// - element with attributes + text: { _: "text", $: { attr: "value" } }
// - element with attributes only: { $: { attr: "value" } }
const ZXmlNode = z.union([z.string(), z.object({ _: z.string().nullish(), $: z.record(z.string()).nullish() }).passthrough()]).nullish()

export const ZEdfJob = z
  .object({
    id: z.union([z.string(), z.number()]).transform((v) => String(v)),
    reference: z.string(),
    entityDescription: z.string().nullish(),
    creationDate: z.string(),
    modificationDate: z.string().nullish(),
    entity: ZXmlNode,
    entityAdress: z
      .object({
        adress: z.string().nullish(),
        postalcode: z.string().nullish(),
        city: z.string().nullish(),
        country: z.string().nullish(),
      })
      .nullish(),
    beginningDate: z.string().nullish(),
    directUrl: z.string().nullish(),
    jobDescription: z.object({
      description: z.string().nullish(),
      missionDescription: z.string().nullish(),
      missionDescriptionFormatted: z.string().nullish(),
      applicantProfile: z.string().nullish(),
      applicantProfileFormatted: z.string().nullish(),
      title: z.string(),
      salaryRange: ZXmlNode,
      contract: ZXmlNode,
      contractLength: z.string().nullish(),
      location: z
        .object({
          jobLocation: z.string().nullish(),
          regions: z
            .object({
              region: ZXmlNode,
            })
            .nullish(),
          departements: z
            .object({
              departement: ZXmlNode,
            })
            .nullish(),
        })
        .passthrough()
        .nullish(),
      customFields: z
        .object({
          datetime1: ZXmlNode,
          LongText1: ZXmlNode,
        })
        .passthrough()
        .nullish(),
    }),
    applicantCriteria: z
      .object({
        diploma: z
          .object({
            $: z.object({ id: z.string().nullish(), clientcode: z.string().nullish() }).passthrough().nullish(),
          })
          .nullish(),
        customFields: z
          .object({
            list1: ZXmlNode,
          })
          .passthrough()
          .nullish(),
      })
      .passthrough()
      .nullish(),
  })
  .passthrough()

export type IEdfJob = z.output<typeof ZEdfJob>

const extractXmlText = (node: z.output<typeof ZXmlNode>): string | null => {
  if (!node) return null
  if (typeof node === "string") return node || null
  return node._ ?? null
}

const extractXmlAttr = (node: z.output<typeof ZXmlNode>, attr: string): string | null => {
  if (!node || typeof node === "string") return null
  return node.$?.[attr] ?? null
}

const getContractType = (contract: IEdfJob["jobDescription"]["contract"]): IComputedJobsPartners["contract_type"] => {
  const clientcode = extractXmlAttr(contract, "clientcode")
  if (clientcode === "CONTRAT_ALTERNANCE") {
    return [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]
  }
  return undefined
}

const getContractStart = (customFields: IEdfJob["jobDescription"]["customFields"]): Date | null => {
  if (!customFields) return null
  const raw = extractXmlText(customFields.datetime1)
  if (!raw) return null
  // format: DD/MM/YYYY
  const parsed = dayjs.tz(raw, "DD/MM/YYYY", "Europe/Paris")
  if (!parsed.isValid()) return null
  return parsed.toDate()
}

const getOfferDescription = (jobDescription: IEdfJob["jobDescription"]): string | null => {
  const html = jobDescription.missionDescriptionFormatted ?? jobDescription.missionDescription ?? jobDescription.description
  if (!html || html.trim().length < 30) return null
  return html
}

const getWorkplaceName = (job: IEdfJob): string | null => {
  // The salaryRange field holds the employer brand name (e.g., "EDF", "Enedis", "Framatome", "Dalkia")
  const brand = extractXmlText(job.jobDescription.salaryRange)
  if (brand) return brand

  // Fallback: entity text content
  const entity = extractXmlText(job.entity)
  if (entity) return entity

  return null
}

const getWorkplaceCity = (job: IEdfJob): string | null => {
  const city = job.entityAdress?.city
  if (city) return city

  const jobLocation = job.jobDescription.location?.jobLocation
  if (jobLocation) return jobLocation

  return null
}

type DiplomaNode = { $?: { id?: string | null; clientcode?: string | null } | null } | null | undefined

const getDiplomaLevel = (diploma: DiplomaNode) => {
  if (!diploma?.$?.clientcode) return null

  const mapping: Record<string, string> = {
    SANS_DIPLOME: "3",
    CAP_BEP_BAC: "4",
    BAC2: "5",
    BAC2_BAC3: "5",
    BAC3: "6",
    BAC4_BAC5: "7",
  }

  const europeanLevel = mapping[diploma.$.clientcode]
  if (!europeanLevel) return null

  const found = NIVEAUX_DIPLOMES_EUROPEENS.find((x) => x.value === europeanLevel)
  if (!found) return null

  return { european: found.value, label: found.label }
}

export const edfJobToJobsPartners = (job: IEdfJob): IComputedJobsPartners | null => {
  const now = new Date()

  // Only process alternance contracts; filter out CDI, VIE, etc.
  const contractClientcode = extractXmlAttr(job.jobDescription.contract, "clientcode")
  if (contractClientcode !== "CONTRAT_ALTERNANCE") {
    return null
  }

  const contract_type = getContractType(job.jobDescription.contract)
  const contractStart = getContractStart(job.jobDescription.customFields)
  const description = getOfferDescription(job.jobDescription)

  // Parse creation date (YYYYMMDD format)
  const creationDate = dayjs.tz(job.creationDate, "YYYYMMDD", "Europe/Paris")
  const offer_creation = creationDate.isValid() ? creationDate.toDate() : null

  let business_error: string | null = null
  if (!job.jobDescription.title || job.jobDescription.title.length < 3) {
    business_error = JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA
  }

  const workplaceCity = getWorkplaceCity(job)
  const workplaceZip = job.entityAdress?.postalcode ?? null

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(now),
    _id: new ObjectId(),
    partner_label: JOBPARTNERS_LABEL.EDF,
    partner_job_id: job.id,
    contract_type,
    contract_start: contractStart,
    offer_title: job.jobDescription.title,
    offer_description: description,
    offer_target_diploma: getDiplomaLevel(job.applicantCriteria?.diploma),
    offer_multicast: true,
    offer_creation,
    offer_expiration: dayjs
      .tz(offer_creation || now)
      .add(2, "months")
      .toDate(),
    workplace_name: getWorkplaceName(job),
    workplace_description: job.entityDescription ?? null,
    workplace_address_city: workplaceCity,
    workplace_address_zipcode: workplaceZip,
    workplace_address_label: workplaceCity,
    apply_url: job.directUrl ?? null,
    business_error,
  }

  return partnerJob
}
