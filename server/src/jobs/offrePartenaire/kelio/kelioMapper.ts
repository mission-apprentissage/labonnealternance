import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants"
import dayjs from "shared/helpers/dayjs"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { formatHtmlForPartnerDescription } from "@/common/utils/stringUtils"

import { blankComputedJobPartner } from "../fillComputedJobsPartners"

export const ZKelioJob = z
  .object({
    html_description: z.string(),
    last_activation_at: z.string(),
    html_profile: z.string(),
    contract_duration: z.number(),
    education_level: z.string(),
    job_start_date: z.string(),
    working_time: z.string(),
    remote_level: z.string(),
    description: z.string(),
    video_host: z.string(),
    created_at: z.string(),
    cover_url: z.string(),
    video_id: z.string(),
    job_type: z.string(),
    profile: z.string(),
    company: z.object({
      name: z.string(),
      slug: z.string(),
      company_description: z.string(),
    }),
    address: z.object({
      city: z.string(),
      street: z.string(),
      country: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      postal_code: z.string(),
      street_number: z.string(),
    }),
    id: z.string(),
    url: z.string(),
    name: z.string(),
    slug: z.string(),
    tags: z.string(),
    salary: z.object({
      max: z.string(),
      min: z.string(),
      currency: z.string(),
    }),
  })
  .passthrough()

export type IKelioJob = z.output<typeof ZKelioJob>

export const kelioJobToJobsPartners = (job: IKelioJob): IComputedJobsPartners => {
  const { id, name, html_description, html_profile, address, url, company, created_at } = job

  const workplace_geopoint: {
    type: "Point"
    coordinates: [number, number]
  } = {
    type: "Point",
    coordinates: [address.longitude, address.latitude],
  }

  const urlParsing = z.string().url().safeParse(url)

  const descriptionComputed = formatHtmlForPartnerDescription(html_description + html_profile).trim()

  const publicationDate = new Date(created_at)

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at: publicationDate,
    partner_label: JOBPARTNERS_LABEL.KELIO,
    partner_job_id: id,

    offer_title: name,
    offer_description: descriptionComputed,
    offer_creation: publicationDate,

    offer_expiration: dayjs.tz(publicationDate).add(2, "months").toDate(),

    workplace_name: company.name,
    workplace_description: company.company_description,
    workplace_address_zipcode: address.postal_code || null,
    workplace_address_city: address.city,
    workplace_address_label: [address.street_number, address.street, address.city, address.postal_code].join(" ").trim(),
    workplace_geopoint,
    apply_url: urlParsing.success ? urlParsing.data : null,
    offer_multicast: true,
    contract_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
  }
  return partnerJob
}
