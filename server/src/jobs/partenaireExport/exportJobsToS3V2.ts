import { createReadStream, createWriteStream } from "fs"
import Stream, { Transform } from "stream"
import { pipeline } from "stream/promises"

import { assertUnreachable, IJob, IRecruiter, JOB_STATUS, JOB_STATUS_ENGLISH } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { NIVEAUX_POUR_LBA, RECRUITER_STATUS } from "shared/constants/recruteur"
import { buildJobUrl } from "shared/metier/lbaitemutils"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { IJobOfferApiReadV3 } from "shared/routes/v3/jobs/jobs.routes.v3.model"

import { concatStreams, waitForStreamEnd } from "@/common/utils/streamUtils"
import config from "@/config"
import { jobsPartnersToApiV3Read } from "@/services/jobs/jobOpportunity/jobOpportunity.service"

import { logger } from "../../common/logger"
import { s3WriteStream } from "../../common/utils/awsUtils"
import { getDbCollection } from "../../common/utils/mongodbUtils"

const getFileWriteStream = (fileName: string) => {
  logger.info(`Generating file ${fileName}`)
  const url = new URL(`./${fileName}`, import.meta.url)
  const writeStream = createWriteStream(url)
  return { writeStream, filePath: url.pathname }
}

const uploadFileToS3 = async (filepath: string, readStream: Stream.Readable) => {
  const key = filepath.split("/").pop() as string
  logger.info(`Uploading file ${filepath} to S3`)
  await s3WriteStream("storage", key, { Body: readStream, CacheControl: "no-cache, no-store, must-revalidate" })
  logger.info(`file ${filepath} uploaded`)
}

export const EXPORT_JOBS_TO_S3_V2_FILENAME = "exportJobsToS3V2.json"

export async function exportJobsToS3V2(handleFileReadStream = uploadFileToS3) {
  const { filePath, writeStream: fileStream } = getFileWriteStream(EXPORT_JOBS_TO_S3_V2_FILENAME)
  const jsonArrayTransform = getJsonArrayTransform()
  jsonArrayTransform.setMaxListeners(20)

  const jobPartnersTransform = getCusorTransform<IJobsPartnersOfferPrivate>((jobPartner) => {
    return JSON.stringify(jobsPartnersToApiV3Read(jobPartner), null, 2)
  })

  const recruiterTransform = getCusorTransform<IRecruiter>((recruiter) => {
    const jobs = recruiterToJobPartner(recruiter)
    const result = jobs.map((job) => JSON.stringify(job, null, 2)).join(", ")
    return result
  })
  concatStreams([recruiterTransform, jobPartnersTransform], jsonArrayTransform)
  jsonArrayTransform.pipe(fileStream, { end: true })

  logger.info("starting job partners cursor")
  const jobPartnersCursor = await getDbCollection("jobs_partners").find({ offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_multicast: true })
  await pipeline(jobPartnersCursor, jobPartnersTransform)

  logger.info("starting recruiters cursor")
  const recruiterCursor = await getDbCollection("recruiters").find({ status: RECRUITER_STATUS.ACTIF, "jobs.job_status": JOB_STATUS.ACTIVE })
  await pipeline(recruiterCursor, recruiterTransform)

  logger.info("waiting for jsonArrayTransform")
  await waitForStreamEnd(jsonArrayTransform)
  console.log("waiting for fileStream")
  await waitForStreamEnd(fileStream)

  logger.info("creating read stream")
  const fileReadStream = createReadStream(filePath)
  await handleFileReadStream(filePath, fileReadStream)
}

function getDiplomaLevel(label: string | null | undefined): IJobsPartnersOfferPrivate["offer_target_diploma"] {
  if (!label) {
    return null
  }
  switch (label) {
    case NIVEAUX_POUR_LBA["3 (CAP...)"]:
      return { european: "3", label }
    case NIVEAUX_POUR_LBA["4 (Bac, Bac pro...)"]:
      return { european: "4", label }
    case NIVEAUX_POUR_LBA["5 (BTS, DEUST...)"]:
      return { european: "5", label }
    case NIVEAUX_POUR_LBA["6 (Licence, BUT...)"]:
      return { european: "6", label }
    case NIVEAUX_POUR_LBA["7 (Master, titre ingénieur...)"]:
      return { european: "7", label }
    default:
      return null
  }
}

function getOfferStatus(job_status: JOB_STATUS, recruiter_status: RECRUITER_STATUS): JOB_STATUS_ENGLISH {
  if (recruiter_status !== RECRUITER_STATUS.ACTIF) {
    return JOB_STATUS_ENGLISH.ANNULEE
  }
  switch (job_status) {
    case JOB_STATUS.ACTIVE:
      return JOB_STATUS_ENGLISH.ACTIVE
    case JOB_STATUS.POURVUE:
      return JOB_STATUS_ENGLISH.POURVUE
    case JOB_STATUS.ANNULEE:
    case JOB_STATUS.EN_ATTENTE:
      return JOB_STATUS_ENGLISH.ANNULEE
    default:
      assertUnreachable(job_status)
  }
}

const recruiterToJobPartner = (recruiter: IRecruiter): IJobOfferApiReadV3[] => {
  return recruiter.jobs.flatMap((job) => {
    const jobPartnerOpt = recruiterJobToJobPartner(recruiter, job)
    return jobPartnerOpt ? [jobPartnerOpt] : []
  })
}

const recruiterJobToJobPartner = (recruiter: IRecruiter, job: IJob): IJobOfferApiReadV3 | null => {
  const { address, geopoint } = recruiter
  const title = job.offer_title_custom ?? job.rome_appellation_label
  const status = getOfferStatus(job.job_status, recruiter.status)
  if (!address || !geopoint || !title || status !== JOB_STATUS_ENGLISH.ACTIVE) {
    return null
  }

  return {
    workplace: {
      brand: recruiter.establishment_enseigne ?? null,
      description: null,
      domain: {
        idcc: recruiter.idcc,
        naf: recruiter.naf_code
          ? {
              code: recruiter.naf_code,
              label: recruiter.naf_label ?? null,
            }
          : null,
        opco: recruiter.opco,
      },
      legal_name: recruiter.establishment_raison_sociale ?? null,
      location: {
        address,
        geopoint,
      },
      name: null,
      siret: recruiter.establishment_siret,
      size: recruiter.establishment_size ?? null,
      website: null,
    },
    offer: {
      access_conditions: [],
      description: "",
      desired_skills: [],
      opening_count: job.job_count ?? 1,
      publication: {
        creation: job.job_creation_date ?? null,
        expiration: job.job_expiration_date ?? null,
      },
      rome_codes: job.rome_code ?? null,
      status,
      target_diploma: getDiplomaLevel(job.job_level_label),
      title,
      to_be_acquired_skills: [],
    },
    apply: {
      phone: null,
      url: `${config.publicUrl}/${buildJobUrl(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job._id.toString(), title)}`,
      recipient_id: null,
    },
    contract: {
      duration: job.job_duration ?? null,
      remote: null,
      start: job.job_start_date,
      type: job.job_type,
    },
    identifier: {
      id: job._id.toString(),
      partner_job_id: job._id.toString(),
      partner_label: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
    },
  }
}

function getJsonArrayTransform() {
  let isFirst = true
  const transform = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (!chunk) {
        callback()
        return
      }
      if (isFirst) {
        this.push("[")
        isFirst = false
      } else {
        this.push(",")
      }
      this.push(chunk)
      callback()
    },
    flush(callback) {
      if (isFirst) {
        this.push("[")
        isFirst = false
      }
      this.push("]")
      callback()
    },
  })
  return transform
}

const getCusorTransform = <T>(mapper: (obj: T) => string | null) => {
  return new Transform({
    readableObjectMode: true,
    writableObjectMode: true,
    transform(chunk: T, encoding, callback) {
      const result = mapper(chunk)
      if (result !== null) {
        this.push(result)
      }
      callback()
    },
    flush(callback) {
      callback()
    },
  })
}
