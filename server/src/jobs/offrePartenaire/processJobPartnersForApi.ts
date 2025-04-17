import { ObjectId } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"

const excludedJobPartnersFromApi = Object.values(JOBPARTNERS_LABEL)

export const processJobPartnersForApi = async () => {
  logger.info("début de processJobPartnersForApi")
  const processId: string = new ObjectId().toString()
  await getDbCollection("computed_jobs_partners").updateMany({ partner_label: { $nin: excludedJobPartnersFromApi } }, { $set: { currently_processed_id: processId } })
  const filter = { currently_processed_id: processId }
  await fillComputedJobsPartners(filter)
  await importFromComputedToJobsPartners(filter)
  await getDbCollection("computed_jobs_partners").deleteMany({ $and: [filter, { validated: true }] })
  await getDbCollection("computed_jobs_partners").updateMany(filter, { $set: { currently_processed_id: null } })
  logger.info("fin de processJobPartnersForApi")
}
