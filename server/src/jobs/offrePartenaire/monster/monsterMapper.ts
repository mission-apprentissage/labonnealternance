import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants"
import dayjs from "shared/helpers/dayjs"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { z } from "zod"

import { removeHtmlTagsFromString } from "@/common/utils/stringUtils"

import { blankComputedJobPartner } from "../fillComputedJobsPartners"

export const ZMonsterJob = z
  .object({
    postingId: z.string(),
    title: z.string(),
    JobActiveDate: z.string(),
    CompanyName: z.string(),
    siretNumber: z.string(),
    JobPostalCode: z.string().nullable(),
    JobCity: z.string(),
    State: z.string(),
    Country: z.string(),
    Latitude: z.string(),
    Longitude: z.string(),
    Industry: z.string(),
    JobCategory: z.string(),
    JobOccupation: z.string(),
    JobLevel: z.string(),
    JobStatus: z.string(),
    JobType: z.string(),
    CompanyJobLogoURL: z.string(),
    JobBody: z.string(),
    guid: z.string(),
  })
  .passthrough()

export type IMonsterJob = z.output<typeof ZMonsterJob>

const sanitizeHtml = (text: string) => {
  let sanitizedText = text.replace("<p>", "\r\n").replace("</p>", "\r\n").replace("<br>", "\r\n").replace("<br/>", "\r\n").replace("<br />", "\r\n")
  sanitizedText = removeHtmlTagsFromString(sanitizedText) as string
  return sanitizedText
}

export const monsterJobToJobsPartners = (job: IMonsterJob): IComputedJobsPartners => {
  const { postingId, title, JobActiveDate, siretNumber, CompanyName, JobPostalCode, JobCity, Latitude, Longitude, JobBody, guid } = job

  const workplace_geopoint: {
    type: "Point"
    coordinates: [number, number]
  } = {
    type: "Point",
    coordinates: [parseFloat(Longitude), parseFloat(Latitude)],
  }

  const urlParsing = extensions.url().safeParse(guid)

  let descriptionComputed = JobBody

  descriptionComputed = sanitizeHtml(descriptionComputed)

  const created_at = new Date()
  const publicationDate = new Date(JobActiveDate)

  const partnerJob: IComputedJobsPartners = {
    ...blankComputedJobPartner(),
    _id: new ObjectId(),
    created_at,
    partner_label: JOBPARTNERS_LABEL.MONSTER,
    partner_job_id: postingId,

    offer_title: title,
    offer_description: descriptionComputed,
    offer_creation: publicationDate,

    offer_expiration: dayjs
      .tz(publicationDate || created_at)
      .add(2, "months")
      .toDate(),

    workplace_name: CompanyName,
    workplace_siret: siretNumber,
    workplace_address_zipcode: JobPostalCode || null,
    workplace_address_city: JobCity,
    workplace_address_label: [JobCity, JobPostalCode].join(" ").trim(),
    workplace_geopoint,
    apply_url: urlParsing.success ? urlParsing.data : null,
    offer_multicast: true,
    contract_type: [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
  }
  return partnerJob
}
