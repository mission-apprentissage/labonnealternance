import type { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

/**
 * La sync des recruteurs_lba vers search_items ne prend désormais que les actifs
 * (offer_status ACTIVE dans le $match de fillSearchItemsCollection). Purge les docs déjà
 * synchronisés qui ne satisfont plus cette règle : recruteurs inactifs, ainsi que les
 * orphelins dont le doc jobs_partners source a disparu (même règle — plus jamais re-syncés).
 */
export const up = async () => {
  const searchItems = getDbCollection("search_items")
  const cursor = searchItems.find({ sub_type: LBA_ITEM_TYPE.RECRUTEURS_LBA }, { projection: { _id: 1 } })

  let scanned = 0
  let deleted = 0
  let batch: ObjectId[] = []

  const flushBatch = async () => {
    if (!batch.length) return
    const activeIds = new Set(
      (
        await getDbCollection("jobs_partners")
          .find({ _id: { $in: batch }, partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA, offer_status: JOB_STATUS_ENGLISH.ACTIVE }, { projection: { _id: 1 } })
          .toArray()
      ).map((doc) => doc._id.toString())
    )
    const toDelete = batch.filter((id) => !activeIds.has(id.toString()))
    if (toDelete.length) {
      const result = await searchItems.deleteMany({ _id: { $in: toDelete } })
      deleted += result.deletedCount
    }
    batch = []
  }

  for await (const doc of cursor) {
    scanned++
    batch.push(doc._id)
    if (batch.length >= 1000) await flushBatch()
  }
  await flushBatch()

  logger.info(`remove-inactive-recruteurs-from-search-items: ${deleted} supprimés sur ${scanned} recruteurs scannés`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
