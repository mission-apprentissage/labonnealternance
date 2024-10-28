import { captureException } from "@sentry/node"
import { modelDescriptors } from "shared/models/models"

import { getDatabase } from "../../common/utils/mongodbUtils"

export async function countInvalidDocuments(collectionName: string): Promise<number> {
  const collection = getDatabase().collection(collectionName)
  const options = await collection.options()

  return collection.countDocuments({ $nor: [options.validator] })
}

export async function validateDocuments(collectionName: string) {
  const invalidCount = await countInvalidDocuments(collectionName)
  if (invalidCount > 0) {
    const error = new Error(`Collection ${collectionName} contains ${invalidCount} invalid documents`)
    captureException(error, { level: "fatal" })
    throw error
  }
}

export async function validateModels(): Promise<void> {
  await Promise.all(modelDescriptors.map((d) => validateDocuments(d.collectionName)))
}
