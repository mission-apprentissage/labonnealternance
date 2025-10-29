import { PassThrough } from "node:stream"
import { pipeline } from "node:stream/promises"

import { ObjectId } from "mongodb"
import { CollectionName } from "shared/models/models"

import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { notifyToSlack } from "../../common/utils/slackUtils"

export const importFromStreamInJson = async ({
  stream,
  destinationCollection,
  partnerLabel,
  getOffers,
}: {
  stream: NodeJS.ReadableStream
  destinationCollection: CollectionName
  partnerLabel: string
  getOffers: (json: object) => object[]
}) => {
  logger.info("deleting old data")
  await getDbCollection(destinationCollection).deleteMany({})

  logger.info("import starting...")

  const now = new Date()
  let offerInsertCount = 0

  const readJson = async (json: object) => {
    const offers = getOffers(json)
    await asyncForEach(offers, async (offer) => {
      await getDbCollection(destinationCollection).insertOne({ ...offer, _id: new ObjectId(), createdAt: now })
      offerInsertCount++
    })
  }

  const chunks: string[] = []

  const takeChunkTransform = new PassThrough({
    transform(chunk, _encoding, callback) {
      chunks.push(chunk.toString())
      callback(null, null)
    },
  })
  await pipeline(stream, takeChunkTransform)
  const content = chunks.join("")
  const json = JSON.parse(content)
  await readJson(json)

  logger.info(`${offerInsertCount} offers inserted`)
  logger.info("Pipeline succeeded.")
  const message = `import ${partnerLabel} terminé : ${offerInsertCount} offres importées`
  logger.info(message)
  await notifyToSlack({
    subject: `import des offres ${partnerLabel} dans raw`,
    message,
  })
  return {
    offerInsertCount,
  }
}
