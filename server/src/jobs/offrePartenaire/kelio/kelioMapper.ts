import { ObjectId } from "mongodb"
import { NIVEAU_DIPLOME_LABEL, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "shared/constants/recruteur"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { blankComputedJobPartner } from "../fillComputedJobsPartners"

export const ZKelioJob = z
  .object({
    html_description: z.string(),
    last_activation_at: z.string(),
    html_profile: z.string(),
    contract_duration: z.string().nullable(),
    education_level: z.string().nullable(),
    job_start_date: z.string().nullable(),
    working_time: z.string(),
    remote_level: z.string().nullable(),
    description: z.string(),
    video_host: z.string().nullable(),
    created_at: z.string(),
    cover_url: z.string(),
    video_id: z.string().nullable(),
    job_type: z.string(),
    profile: z.string(),
    company: z.object({
      name: z.string(),
      slug: z.string(),
      company_description: z.string(),
    }),
    address: z.object({
      city: z.string().nullable(),
      street: z.string().nullable(),
      country: z.string(),
      latitude: z.string(),
      longitude: z.string(),
      postal_code: z.string(),
      street_number: z.string().nullable(),
    }),
    id: z.string(),
    url: z.string(),
    name: z.string(),
    slug: z.string(),
    tags: z.string().nullable(),
    salary: z.object({
      max: z.string().nullable(),
      min: z.string().nullable(),
      currency: z.string(),
    }),
  })
  .passthrough()

export type IKelioJob = z.output<typeof ZKelioJob>

export const kelioJobToJobsPartners = (job: IKelioJob): IComputedJobsPartners => {
  const { id, name, html_description, html_profile, address, url, company, created_at, last_activation_at, job_type, contract_duration, job_start_date, education_level } = job

  const workplace_geopoint: {
    type: "Point"
    coordinates: [number, number]
  } = {
    type: "Point",
    coordinates: [parseFloat(address.longitude), parseFloat(address.latitude)],
  }

  let business_error: string | null = null

  let contract_type: ("Apprentissage" | "Professionnalisation")[] = []
  if (job_type === "Alternating") {
    contract_type = [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]
  } else if (job_type.toUpperCase() === "Professional Contract".toUpperCase()) {
    contract_type = [TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]
  } else if (job_type === "Internship") {
    business_error = JOB_PARTNER_BUSINESS_ERROR.STAGE
  }

  let contract_remote: TRAINING_REMOTE_TYPE | null = null
  switch (job.remote_level) {
    case "unauthorized":
    case "fulltime":
      contract_remote = TRAINING_REMOTE_TYPE.onsite
      break
    case "punctual":
    case "partial":
      contract_remote = TRAINING_REMOTE_TYPE.hybrid
      break
    default:
      contract_remote = null
  }

  let offer_target_diploma: { european: "3" | "4" | "5" | "6" | "7"; label: string } | null = null
  switch (education_level) {
    case "CAP/BEP":
      offer_target_diploma = { european: "3", label: NIVEAU_DIPLOME_LABEL["3"] }
      break
    case "BAC":
      offer_target_diploma = { european: "4", label: NIVEAU_DIPLOME_LABEL["4"] }
      break
    case "BAC +2":
      offer_target_diploma = { european: "5", label: NIVEAU_DIPLOME_LABEL["5"] }
      break
    case "BAC +3":
      offer_target_diploma = { european: "6", label: NIVEAU_DIPLOME_LABEL["6"] }
      break
    case "BAC +5":
    case ">BAC +5":
      offer_target_diploma = { european: "7", label: NIVEAU_DIPLOME_LABEL["7"] }
      break
    default:
      offer_target_diploma = null
  }

  const urlParsing = z.string().url().safeParse(url)

  const descriptionComputed = html_description + html_profile.trim()

  const publicationDate = new Date(created_at)
  const updatedDate = last_activation_at ? new Date(last_activation_at) : null

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at: publicationDate,
    partner_label: JOBPARTNERS_LABEL.KELIO,
    partner_job_id: id,

    offer_title: name,
    offer_description: descriptionComputed,
    offer_creation: publicationDate,

    offer_expiration: dayjs
      .tz(updatedDate ?? publicationDate)
      .add(2, "months")
      .toDate(),

    workplace_name: company.name,
    workplace_description: company.company_description,
    workplace_address_zipcode: address.postal_code || null,
    workplace_address_city: address.city,
    workplace_address_label: [address.street_number, address.street, address.postal_code, address.city].join(" ").trim(),
    workplace_geopoint,
    apply_url: urlParsing.success ? urlParsing.data : null,
    offer_multicast: true,
    contract_type,
    contract_start: new Date(job_start_date!),
    contract_remote,
    offer_target_diploma,
    contract_duration: contract_duration ? parseInt(contract_duration) : null,
    business_error,
  }
  return partnerJob
}
