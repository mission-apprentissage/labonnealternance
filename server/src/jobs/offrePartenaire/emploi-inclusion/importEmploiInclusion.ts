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

  const message = `import ${partnerLabel} terminé : ${jobsById.size} offres importées`
  logger.info(message)
  notifyToSlack({
    subject: `import des offres ${partnerLabel} dans raw`,
    message,
  })
}

export const importEmploiInclusionToComputed = async () => {
  const totalRaw = await getDbCollection(rawCollectionName).countDocuments()
  logger.info(`début d'import dans computed_jobs_partners pour partner_label=${partnerLabel} — ${totalRaw} documents raw`)

  const importDate = new Date()
  const counters = { rawParseError: 0, rawOk: 0, postesTotal: 0, postesEligibles: 0, success: 0, insertError: 0 }

  await getDbCollection("computed_jobs_partners").deleteMany({ partner_label: partnerLabel })

  const cursor = getDbCollection(rawCollectionName).find({})

  try {
    for await (const document of cursor) {
      const parsed = ZEmploiInclusionJob.safeParse(document)
      if (!parsed.success) {
        counters.rawParseError++
        if (counters.rawParseError <= 3) {
          logger.error({ err: parsed.error.issues }, `emploi-inclusion: document raw invalide id=${document.id}`)
        }
        continue
      }

      counters.rawOk++
      const job = parsed.data
      counters.postesTotal += job.postes.length
      const eligiblePostes = job.postes.filter(isEligiblePoste)
      counters.postesEligibles += eligiblePostes.length

      for (const poste of eligiblePostes) {
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
          counters.insertError++
          const newError = internal(`error converting emploi-inclusion poste id=${poste.id} for job id=${job.id}`)
          logger.error(err, newError.message)
          newError.cause = err
          sentryCaptureException(newError)
        }
      }
    }
  } finally {
    logger.info({ counters }, `emploi-inclusion: fin du parcours cursor`)
  }

  const message = `import dans computed_jobs_partners pour partner_label=${partnerLabel} terminé. rawOk=${counters.rawOk}, rawParseError=${counters.rawParseError}, postesTotal=${counters.postesTotal}, postesEligibles=${counters.postesEligibles}, success=${counters.success}, insertError=${counters.insertError}`
  logger.info(message)
  await notifyToSlack({ subject: `mapping Raw => computed_jobs_partners`, message, error: counters.rawParseError > 0 || counters.insertError > 0 })
}

export const processEmploiInclusion = async () => {
  await importEmploiInclusionRaw()
  await importEmploiInclusionToComputed()
}
