import { ApiClient } from "api-alternance-sdk"
import { internal } from "@hapi/boom"
import { ObjectId } from "bson"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawEmploiInclusionModel from "shared/models/rawEmploiInclusion.model"

import { emploiInclusionJobToJobsPartners, isEligiblePoste } from "./emploi-inclusion.mapper"
import { getAllEmploiInclusionJobsByDepartement, ZEmploiInclusionJob } from "@/common/apis/emploiInclusion/emploi-inclusion.client"
import config from "@/config"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

const partnerLabel = JOBPARTNERS_LABEL.EMPLOI_INCLUSION
const rawCollectionName = rawEmploiInclusionModel.collectionName

export const importEmploiInclusionRaw = async () => {
  const now = new Date()

  await getDbCollection(rawCollectionName).deleteMany({})

  const apiClient = new ApiClient({ key: config.apiApprentissage.apiKey })
  const departements = await apiClient.geographie.listDepartements()

  const jobsById = new Map<string, object>()
  for (const { codeInsee } of departements) {
    logger.info(`import emploi-inclusion raw département ${codeInsee}`)
    try {
      const jobs = await getAllEmploiInclusionJobsByDepartement(codeInsee)
      for (const job of jobs) {
        jobsById.set(job.id, job)
      }
    } catch (err) {
      logger.error(err, `emploi-inclusion: échec récupération département ${codeInsee}`)
      sentryCaptureException(err)
    }
  }

  if (jobsById.size > 0) {
    await getDbCollection(rawCollectionName).insertMany([...jobsById.values()].map((job) => ({ ...job, _id: new ObjectId(), createdAt: now })))
  }

  logger.info(`import emploi-inclusion raw terminé : ${jobsById.size} entreprises stockées`)
}

export const importEmploiInclusionToComputed = async () => {
  logger.info(`début d'import dans computed_jobs_partners pour partner_label=${partnerLabel}`)

  const importDate = new Date()
  const counters = { total: 0, success: 0, error: 0 }

  await getDbCollection("computed_jobs_partners").deleteMany({ partner_label: partnerLabel })

  const cursor = getDbCollection(rawCollectionName).find({})

  for await (const document of cursor) {
    const parsed = ZEmploiInclusionJob.safeParse(document)
    if (!parsed.success) {
      counters.error++
      logger.error({ err: parsed.error }, `emploi-inclusion: document raw invalide id=${document.id}`)
      continue
    }

    const job = parsed.data
    for (const poste of job.postes.filter(isEligiblePoste)) {
      counters.total++
      try {
        const computedJobPartner = emploiInclusionJobToJobsPartners(job, poste)
        await getDbCollection("computed_jobs_partners").insertOne({
          ...computedJobPartner,
          partner_label: partnerLabel,
          created_at: importDate,
          updated_at: importDate,
        })
        counters.success++
      } catch (err) {
        counters.error++
        const newError = internal(`error converting emploi-inclusion poste id=${poste.id} for job id=${job.id}`)
        logger.error(err, newError.message)
        newError.cause = err
        sentryCaptureException(newError)
      }
    }
  }

  const message = `import dans computed_jobs_partners pour partner_label=${partnerLabel} terminé. total=${counters.total}, success=${counters.success}, errors=${counters.error}`
  logger.info(message)
  await notifyToSlack({ subject: `mapping Raw => computed_jobs_partners`, message, error: counters.error > 0 })
}

export const processEmploiInclusion = async () => {
  await importEmploiInclusionRaw()
  await importEmploiInclusionToComputed()
}
