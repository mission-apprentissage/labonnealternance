import { Writable } from "node:stream"
import { pipeline } from "node:stream/promises"

import { ObjectId } from "mongodb"
import type { CollectionName } from "shared/models/models"
import { logger } from "@/common/logger"
import { parseCsv } from "@/common/utils/file-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { commitRawImport, discardRawImport } from "./raw-import-commit"

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
  logger.info("import starting...")

  const now = new Date()
  let offerInsertCount = 0

  try {
    await pipeline(
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
      })
    )
  } catch (err) {
    logger.error(err, "Pipeline failed.")
    await discardRawImport({ destinationCollection, importDate: now, importName: partnerLabel })
    throw err
  }

  await commitRawImport({ destinationCollection, importDate: now, importName: partnerLabel, insertedCount: offerInsertCount })

  logger.info(`import ${partnerLabel} terminé : ${offerInsertCount} offres importées`)
  return {
    offerInsertCount,
  }
}
