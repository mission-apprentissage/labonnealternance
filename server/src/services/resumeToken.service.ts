import { ObjectId } from "bson"
import type { CollectionName } from "shared/models/models"
import type { IResumeTokenData } from "shared/models/resumeTokens.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const getResumeToken = async (collection: CollectionName) => getDbCollection("resumetokens").findOne({ collection })

export const storeResumeToken = async (collection: CollectionName, resumeTokenData: IResumeTokenData) => {
  await getDbCollection("resumetokens").updateOne(
    { collection },
    {
      $set: {
        resumeTokenData,
        updatedAt: new Date(),
        collection,
      },
      $setOnInsert: { _id: new ObjectId() },
    },
    { upsert: true }
  )
}
