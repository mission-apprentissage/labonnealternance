import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

export const up = async () => {
  const { modifiedCount } = await getDbCollection("unsubscribedrecruteurslba").updateMany(
    { unsubscribe_reason_detail: { $exists: false } },
    { $set: { unsubscribe_reason_detail: null } },
    { bypassDocumentValidation: true }
  )

  logger.info(`backfill unsubscribe_reason_detail 5682 : ${modifiedCount} désinscriptions mises à jour`)
}

export const requireShutdown: boolean = false
