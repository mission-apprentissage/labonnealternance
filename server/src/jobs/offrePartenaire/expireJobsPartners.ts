import { JOB_STATUS_ENGLISH } from "shared/models/index"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const expireJobsPartners = async () => {
  const result = await getDbCollection("jobs_partners").updateMany(
    { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_expiration: { $lt: new Date() } },
    { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE } }
  )
  logger.info(`expireJobsPartners: ${result.modifiedCount} offres expirées`)
}
