import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const blacklistedRomes = ["K2202", "G1605", "I1201", "L1102", "N4104"]

export const blockBadRomeJobsPartners = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const job = COMPUTED_ERROR_SOURCE.BLOCK_BAD_ROME
  const jobLogger = logger.child({ job })
  jobLogger.info(`job ${job} : début d'enrichissement des données`)

  const filter = {
    offer_rome_codes: { $ne: null, $elemMatch: { $in: blacklistedRomes } },
    business_error: null,
    jobs_in_success: { $nin: [job] },
    ...(addedMatchFilter ?? {}),
  }

  const result = await getDbCollection("computed_jobs_partners").updateMany(filter, {
    $set: { business_error: JOB_PARTNER_BUSINESS_ERROR.ROME_BLACKLISTED, updated_at: new Date() },
    $pull: { errors: { source: job } },
    $push: { jobs_in_success: job },
  })

  jobLogger.info(`job ${job} : enrichissement terminé. modifiedCount=${result.modifiedCount}`)
}
