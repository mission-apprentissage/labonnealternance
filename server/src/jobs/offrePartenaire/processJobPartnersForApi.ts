import { ObjectId } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const excludedJobPartnersFromApi = Object.values(JOBPARTNERS_LABEL)

export const processJobPartnersForApi = async () => {
  logger.info("début de processJobPartnersForApi")
  const processId: string = new ObjectId().toString()
  const last2Days = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  await getDbCollection("computed_jobs_partners").updateMany(
    { partner_label: { $nin: excludedJobPartnersFromApi }, updated_at: { $gte: last2Days } },
    { $set: { currently_processed_id: processId, errors: [] } }
  )

  const filter = { currently_processed_id: processId }
  await fillComputedJobsPartners({ addedMatchFilter: filter, shouldNotifySlack: false })
  await importFromComputedToJobsPartners(filter, false)
  await getDbCollection("computed_jobs_partners").deleteMany({ $and: [filter, { validated: true }] })
  await getDbCollection("computed_jobs_partners").updateMany(filter, { $set: { currently_processed_id: null } })
  logger.info("fin de processJobPartnersForApi")
}
