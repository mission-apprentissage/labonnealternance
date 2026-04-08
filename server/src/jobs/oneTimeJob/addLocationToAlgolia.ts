import type { AnyBulkWriteOperation } from "mongodb"
import type { IAlgolia } from "shared/models/algolia.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const BATCH_SIZE = 1000

/**
 * KBA 2026-03-17 : Complète le champ `location` (GeoJSON Point pour MongoDB Search)
 * à partir du champ `_geoloc` (format Algolia { lat, lng }) et convertit
 * `publication_date` de millisecondes en Date sur la collection `algolia`.
 */
export const OneTimeJob_AddLocationToAlgolia = async () => {
  logger.info("OneTimeJob_AddLocationToAlgolia - START")

  const total = await getDbCollection("algolia").countDocuments({
    "_geoloc.lat": { $exists: true },
    "_geoloc.lng": { $exists: true },
    $or: [{ location: { $exists: false } }, { publication_date: { $type: "long" } }, { publication_date: { $type: "int" } }, { publication_date: { $type: "double" } }],
  })

  if (total === 0) {
    logger.info("Aucun document à traiter - fin de job")
    return
  }

  logger.info(`${total} documents à traiter`)

  let processed = 0

  const cursor = getDbCollection("algolia")
    .find(
      {
        "_geoloc.lat": { $exists: true },
        "_geoloc.lng": { $exists: true },
        $or: [{ location: { $exists: false } }, { publication_date: { $type: "long" } }, { publication_date: { $type: "int" } }, { publication_date: { $type: "double" } }],
      },
      { projection: { _id: 1, _geoloc: 1, publication_date: 1 } }
    )
    .batchSize(BATCH_SIZE)

  let batch: AnyBulkWriteOperation<IAlgolia>[] = []

  for await (const doc of cursor) {
    const setFields: Record<string, unknown> = {
      location: {
        type: "Point",
        coordinates: [doc._geoloc.lng, doc._geoloc.lat],
      },
    }

    if (typeof doc.publication_date === "number") {
      setFields.publication_date = new Date(doc.publication_date)
    }

    batch.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: setFields },
      },
    })

    if (batch.length >= BATCH_SIZE) {
      await getDbCollection("algolia").bulkWrite(batch, { ordered: false, bypassDocumentValidation: true })
      processed += batch.length
      logger.info(`${processed}/${total} documents traités`)
      batch = [] as AnyBulkWriteOperation<IAlgolia>[]
    }
  }

  if (batch.length > 0) {
    await getDbCollection("algolia").bulkWrite(batch, { ordered: false, bypassDocumentValidation: true })
    processed += batch.length
  }

  logger.info(`OneTimeJob_AddLocationToAlgolia - END (${processed} documents mis à jour)`)
}
