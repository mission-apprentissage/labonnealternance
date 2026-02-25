import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const blockJobsPartnersWithNaf85 = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const job = COMPUTED_ERROR_SOURCE.REMOVE_NAF_85
  const jobLogger = logger.child({ job })
  jobLogger.info(`job ${job} : début d'enrichissement des données`)

  const filter = {
    workplace_naf_code: { $regex: "^85" },
    business_error: null,
    jobs_in_success: { $nin: [job] },
    ...(addedMatchFilter ?? {}),
  }

  const result = await getDbCollection("computed_jobs_partners").updateMany(filter, {
    $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.CFA, updated_at: new Date() },
    $pull: { errors: { source: job } },
    $push: { jobs_in_success: job },
  })

  jobLogger.info(`job ${job} : enrichissement terminé. modifiedCount=${result.modifiedCount}`)
}
