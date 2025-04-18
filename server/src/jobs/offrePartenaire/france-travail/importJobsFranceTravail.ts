import { ApiClient } from "api-alternance-sdk"
import { ObjectId } from "bson"
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

logger

export const importFranceTravailRaw = async () => {
  const apiClient = new ApiClient({
    key: config.apiApprentissage.apiKey,
  })
  const departements = await apiClient.geographie.listDepartements()
  const codesDepartements = departements.map((d) => d.codeInsee)

  let allJobs = [] as Omit<IFTJobRaw, "_id" | "createdAt">[]
  for (const codeDepartement of codesDepartements) {
    const jobs = await getAllFTJobsByDepartments(codeDepartement)
    allJobs = [...allJobs, ...jobs]
  }

  await getDbCollection("raw_francetravail").updateMany(
    { id: { $nin: allJobs.map(({ id }) => id) } as any, unpublishedAt: { $exists: false } },
    { $set: { unpublishedAt: new Date(), updatedAt: new Date() } }
  )

  for (const rawFtJob of allJobs) {
    await getDbCollection("raw_francetravail").findOneAndUpdate(
      { id: rawFtJob.id as string },
      {
        $set: { ...rawFtJob, updatedAt: new Date() },
        $setOnInsert: { _id: new ObjectId(), createdAt: new Date() },
      },
      { upsert: true }
    )
  }
  const message = `import France Travail terminé : ${allJobs.length} offres importées`
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
