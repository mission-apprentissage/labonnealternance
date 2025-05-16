import { ApiClient } from "api-alternance-sdk"
import { ObjectId } from "bson"
import type { AnyBulkWriteOperation } from "mongodb"
import { ZFTJobRaw, type IFTJobRaw } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawFranceTravailModel from "shared/models/rawFranceTravail.model"

import { getAllFTJobsByDepartments } from "@/common/apis/franceTravail/franceTravail.client"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"

import { logger } from "../../../common/logger"
import { notifyToSlack } from "../../../common/utils/slackUtils"
import { rawToComputedJobsPartners } from "../rawToComputedJobsPartners"

import { franceTravailJobsToJobsPartners } from "./franceTravailMapper"

export const importFranceTravailRaw = async () => {
  const now = new Date()

  const apiClient = new ApiClient({
    key: config.apiApprentissage.apiKey,
  })
  const departements = await apiClient.geographie.listDepartements()
  const codesDepartements = departements.map((d) => d.codeInsee)

  for (const codeDepartement of codesDepartements) {
    for await (const jobs of getAllFTJobsByDepartments(codeDepartement)) {
      const ops = jobs.map((rawFtJob): AnyBulkWriteOperation<IFTJobRaw> => {
        return {
          updateOne: {
            filter: { id: rawFtJob.id as string },
            update: {
              $set: { ...rawFtJob, updatedAt: now },
              $setOnInsert: { _id: new ObjectId(), createdAt: now },
            },
            upsert: true,
          },
        }
      })

      if (ops.length > 0) {
        await getDbCollection("raw_francetravail").bulkWrite(ops, { ordered: false })
      }
    }
  }

  const count = await getDbCollection("raw_francetravail").countDocuments({
    updatedAt: now,
    unpublishedAt: { $exists: false },
  })
  await getDbCollection("raw_francetravail").updateMany({ updatedAt: { $lt: now } }, { $set: { unpublishedAt: now, updatedAt: now } })

  const message = `import France Travail terminé : ${count} offres importées`
  logger.info(message)
  await notifyToSlack({
    subject: `import des offres France Travail dans raw`,
    message,
  })
}

export const importFranceTravailToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawFranceTravailModel.collectionName,
    partnerLabel: JOBPARTNERS_LABEL.FRANCE_TRAVAIL,
    zodInput: ZFTJobRaw,
    mapper: franceTravailJobsToJobsPartners,
    rawFilterQuery: { unpublishedAt: { $exists: false } },
  })
}
