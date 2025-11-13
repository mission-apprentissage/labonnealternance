import { pipeline, Writable } from "node:stream"

import { ObjectId } from "mongodb"
import type { CollectionName } from "shared/models/models"

import { notifyToSlack } from "@/common/utils/slackUtils"
import { logger } from "@/common/logger"
import { parseCsv } from "@/common/utils/fileUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const importFromStreamInCsv = async ({
  stream,
  destinationCollection,
  partnerLabel,
  parseOptions = {},
}: {
  stream: NodeJS.ReadableStream
  destinationCollection: CollectionName
  partnerLabel: string
  parseOptions?: { [key: string]: any }
}) => {
  logger.info("deleting old data")
  await getDbCollection(destinationCollection).deleteMany({})

  logger.info("import starting...")

  const now = new Date()
  let offerInsertCount = 0

  return new Promise((resolve, reject) => {
    pipeline(
      stream,
      parseCsv(parseOptions),
      new Writable({
        objectMode: true,
        highWaterMark: 10,
        write: async (json: any, _, callback) => {
          try {
            await getDbCollection(destinationCollection).insertOne({ job: { ...json }, _id: new ObjectId(), createdAt: now })
            offerInsertCount++
            callback()
          } catch (err: any) {
            callback(err)
          }
        },
      }),
      (err) => {
        logger.info(`${offerInsertCount} offers inserted`)
        if (err) {
          logger.error("Pipeline failed.", err)
          reject(err)
        } else {
          logger.info("Pipeline succeeded.")
          const message = `import ${partnerLabel} terminé : ${offerInsertCount} offres importées`
          logger.info(message)
          notifyToSlack({
            subject: `import des offres ${partnerLabel} dans raw`,
            message,
          })
          resolve({
            offerInsertCount,
          })
        }
      }
    )
  })
}
