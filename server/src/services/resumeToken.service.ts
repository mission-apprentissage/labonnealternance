import { CollectionName } from "shared/models/models"
import { IResumeTokenData } from "shared/models/resumeTokens.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const getResumeToken = async (collection: CollectionName) => getDbCollection("resumetokens").findOne({ collection })

export const storeResumeToken = async (collection: CollectionName, resumeToken: IResumeTokenData) => {
  await getDbCollection("resumetokens").updateOne({ collection }, { $set: { resumeToken, updatedAt: new Date() }, $setOnInsert: { collection } }, { upsert: true })
}
