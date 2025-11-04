import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners} from "shared/models/jobsPartnersComputed.model";
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { blankComputedJobPartner } from "@/jobs/offrePartenaire/fillComputedJobsPartners"

export const ZJoobleJob = z
  .object({
    guid: z.string(),
    referencenumber: z.string(),
    url: z.string(),
    title: z.string(),
    region: z.object({
      country: z.string(),
      state: z.string(),
      city: z.string(),
    }),
    date_updated: z.string(),
    cpc: z.string(),
    currency: z.string(),
    company: z.string(),
    date_expired: z.string().nullable(),
    job_type: z.string().nullish(),
    description: z.string(),
    salary: z.object({
      min: z.string().nullable(),
      max: z.string().nullable(),
      currency: z.string().nullable(),
      rate: z.string().nullable(),
    }),
  })
  .passthrough()

export type IJoobleJob = z.output<typeof ZJoobleJob>

export const joobleJobToJobsPartners = (job: IJoobleJob): IComputedJobsPartners => {
  const publicationDate = new Date()
  const updatedDate = new Date(job.date_updated.split(" ")[0])

  const regex = /\b(?:cdi|interim)\b/i
  const business_error = regex.test(job.description) || regex.test(job.title) ? JOB_PARTNER_BUSINESS_ERROR.FULL_TIME : null

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at: updatedDate ?? publicationDate,
    partner_label: JOBPARTNERS_LABEL.JOOBLE,
    partner_job_id: job.referencenumber,
    offer_title: job.title,
    workplace_name: job.company,
    workplace_address_city: job.region.city.split(",")[0],
    workplace_address_label: job.region.city.split(",")[0],
    offer_description: job.description,
    offer_creation: updatedDate ?? publicationDate,
    offer_expiration: dayjs
      .tz(updatedDate ?? publicationDate)
      .add(2, "months")
      .toDate(),
    apply_url: job.url,
    offer_multicast: true,
    contract_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE],
    business_error,
  }
  return partnerJob
}
