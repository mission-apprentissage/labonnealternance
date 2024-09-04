import { JOB_STATUS } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const cancelRemovedJobsPartners = async () => {
  const job_update_date = new Date()
  const pipeline = [
    {
      $lookup: {
        from: "computed_jobs_partners",
        localField: "partner_job_id",
        foreignField: "partner_job_id",
        as: "matched",
      },
    },
    {
      $match: {
        matched: { $size: 0 },
      },
    },
    {
      $set: { offer_status: JOB_STATUS.ANNULEE, job_update_date },
    },
    {
      $merge: {
        into: "jobs_partners",
        whenMatched: "merge",
        whenNotMatched: "discard",
      },
    },
  ]

  await getDbCollection("jobs_partners").aggregate(pipeline)
}
