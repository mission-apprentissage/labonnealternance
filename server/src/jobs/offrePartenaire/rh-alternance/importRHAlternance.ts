import { internal } from "@hapi/boom"
import axios from "axios"
import { ObjectId } from "mongodb"
import { TRAINING_CONTRACT_TYPE } from "shared/constants"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import rawRHAlternanceModel, { IRawRHAlternance } from "shared/models/rawRHAlternance.model"
import { joinNonNullStrings } from "shared/utils"
import { z } from "zod"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import dayjs from "@/services/dayjs.service"

import { blankComputedJobPartner } from "../fillComputedJobsPartners"
import { rawToComputedJobsPartners } from "../rawToComputedJobsPartners"

const ZRawRHAlternanceJob = rawRHAlternanceModel.zod.shape.job

const ZRHAlternanceResponse = z
  .object({
    jobs: z.array(ZRawRHAlternanceJob),
    pageCount: z.number(),
  })
  .passthrough()

const rawCollectionName = rawRHAlternanceModel.collectionName

export const importRHAlternanceRaw = async () => {
  logger.info("deleting old data")
  await getDbCollection(rawCollectionName).deleteMany({})
  logger.info("import starting...")

  let shouldContinue = true
  let currentPage = 1
  let pageCount: number | null = null
  let jobCount = 0
  const importDate = new Date()
  while (shouldContinue) {
    logger.info(`import of RHAlternance: page ${currentPage} / ${pageCount ?? "?"}`)
    const response = await axios.request({
      method: "POST",
      url: "https://rhalternance.com/api/jobs",
      headers: {
        Authorization: config.rhalternance.apiKey,
      },
      data: `Page=${currentPage}`,
    })
    if (response.status >= 400) {
      throw internal(`Error when calling RHAlternance: status=${response.status}`, { data: response.data })
    }
    const parsed = ZRHAlternanceResponse.safeParse(response.data)
    if (!parsed.success) {
      throw internal(`Error when parsing RHAlternance response`, { error: parsed.error })
    }
    const savedJobs: IRawRHAlternance[] = parsed.data.jobs.map((job) => ({ job, createdAt: importDate, _id: new ObjectId() }))
    if (savedJobs.length) {
      await getDbCollection(rawCollectionName).insertMany(savedJobs)
      currentPage++
      pageCount = parsed.data.pageCount
    } else {
      shouldContinue = false
    }
    jobCount += savedJobs.length
  }
  const message = `import RH Alternance terminé : ${jobCount} offres importées`
  logger.info(message)
  await notifyToSlack({
    subject: `import des offres RH Alternance dans raw`,
    message,
  })
}

export const importRHAlternanceToComputed = async () => {
  const now = new Date()
  await rawToComputedJobsPartners({
    collectionSource: rawCollectionName,
    partnerLabel: JOBPARTNERS_LABEL.RH_ALTERNANCE,
    zodInput: ZRawRHAlternanceJob,
    mapper: rawRhAlternanceToComputedMapper(now),
    documentJobRoot: "job",
  })
}

export const rawRhAlternanceToComputedMapper =
  (now: Date) =>
  ({
    jobCode,
    companyName,
    companySiret,
    companyUrl,
    jobTitle,
    jobDescription,
    jobSubmitDateTime,
    jobType,
    jobUrl,
    jobCity,
    jobPostalCode,
  }: IRawRHAlternance["job"]): IComputedJobsPartners => {
    const offer_creation = jobSubmitDateTime ? dayjs.tz(jobSubmitDateTime).toDate() : now
    const isValid: boolean = jobType === "Alternance"
    const computedJob: IComputedJobsPartners = {
      ...blankComputedJobPartner,
      _id: new ObjectId(),
      partner_job_id: jobCode,
      partner_label: JOBPARTNERS_LABEL.RH_ALTERNANCE,
      contract_type: jobType === "Alternance" ? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION] : [],
      offer_title: jobTitle,
      offer_description:
        (jobDescription ?? [])
          .map(({ descriptionHeadline, descriptionText }) => [descriptionHeadline, descriptionText].join(" : "))
          .filter((line) => line.length)
          .join("\n")
          .replace(/<br\s*\/?>/g, "\r\n") || null,
      offer_creation,
      offer_expiration: dayjs.tz(offer_creation).add(60, "days").toDate(),
      offer_opening_count: 1,
      offer_multicast: true,
      workplace_siret: companySiret,
      workplace_name: companyName,
      workplace_website: companyUrl,
      workplace_address_label: joinNonNullStrings([jobPostalCode, jobCity]),
      workplace_address_city: jobCity,
      workplace_address_zipcode: jobPostalCode,
      apply_url: jobUrl,
      business_error: isValid ? null : `expected jobType === "Alternance" but got ${jobType}`,
      updated_at: now,
    }
    return computedJob
  }
