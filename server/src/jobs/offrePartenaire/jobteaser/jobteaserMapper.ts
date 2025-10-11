import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "shared/constants/recruteur"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { blankComputedJobPartner } from "../fillComputedJobsPartners"

export const ZJobteaserJob = z
  .object({
    id: z.string(),
    job_details: z.object({
      title: z.string(),
      description: z.string(),
      url: z.string(),
      contract_type: z.string(),
      remote_type: z.string(),
    }),
    job_dates: z.object({
      start_date: z.string().nullable(),
      first_activated_at: z.string(),
    }),
    job_locations: z.object({
      location_country_name: z.string(),
      location_city: z.string(),
      location_country_code: z.string(),
      location_state: z.string(),
      location_sub_state: z.string().nullable(),
    }),
    company: z.object({
      company_name: z.string(),
      company_siren: z.string().nullable(),
    }),
  })
  .passthrough()

export type IJobteaserJob = z.output<typeof ZJobteaserJob>

export const jobteaserJobToJobsPartners = (job: IJobteaserJob): IComputedJobsPartners => {
  const { id, job_details, job_dates, job_locations, company } = job

  const { title, description, url, contract_type: job_type, remote_type } = job_details
  const { start_date, first_activated_at } = job_dates
  const { location_city } = job_locations
  const { company_name } = company

  let business_error: string | null = null

  let contract_type: ("Apprentissage" | "Professionnalisation")[] = []
  if (job_type === "Apprenticeship") {
    contract_type = [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]
  } else {
    business_error = JOB_PARTNER_BUSINESS_ERROR.STAGE
  }

  let contract_remote: TRAINING_REMOTE_TYPE | null = null
  switch (remote_type) {
    case "Remote not allowed":
      contract_remote = TRAINING_REMOTE_TYPE.onsite
      break
    case "Remote partial allowed":
      contract_remote = TRAINING_REMOTE_TYPE.hybrid
      break
    case "Remote full allowed":
    case "Remote only":
      contract_remote = TRAINING_REMOTE_TYPE.remote
      break
    default:
      contract_remote = null
  }

  const urlParsing = z.string().url().safeParse(url)

  const publicationDate = new Date(first_activated_at)

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at: publicationDate,
    partner_label: JOBPARTNERS_LABEL.JOBTEASER,
    partner_job_id: id,

    offer_title: title,
    offer_description: description,
    offer_creation: publicationDate,

    offer_expiration: dayjs.tz(publicationDate).add(2, "months").toDate(),

    workplace_name: company_name,
    workplace_address_city: location_city,
    workplace_address_label: location_city,
    apply_url: urlParsing.data ?? null,
    offer_multicast: true,
    contract_type,
    contract_start: start_date ? new Date(start_date) : null,
    contract_remote,
    business_error,
  }
  return partnerJob
}
