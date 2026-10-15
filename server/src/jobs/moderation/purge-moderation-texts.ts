import dayjs from "shared/helpers/dayjs"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Textes d'offre et extraits conservés un an après la classification, comme les raisons de signalement d'offre et les CV
 * (#5497). Verdicts, catégories et métadonnées restent, pour les taux et la calibration.
 * Pas de notification Slack, contrairement aux anonymisations : un échec remonte par le check-in Sentry du cron.
 */
export const purgeModerationTexts = async ({ now = new Date() }: { now?: Date } = {}) => {
  const limit = dayjs(now).subtract(1, "year").toDate()
  const { modifiedCount } = await getDbCollection("jobs_partners_moderations").updateMany(
    { created_at: { $lt: limit }, masked_text: { $ne: null } },
    { $set: { original_text: null, masked_text: null, "findings.$[].verbatim": null } }
  )
  logger.info({ modifiedCount, limit }, "purge des textes de modération")
  return { modifiedCount }
}
