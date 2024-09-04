import { JOB_STATUS } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const cancelRemovedJobsPartners = async () => {
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
      $set: { offer_status: JOB_STATUS.ANNULEE },
    },
    {
      $unset: "matched",
    },
    {
      $merge: {
        into: "jobs_partners",
        on: ["partner_job_id", "partner_label"],
        whenMatched: "merge",
        whenNotMatched: "discard",
      },
    },
  ]

  await getDbCollection("jobs_partners").aggregate(pipeline)
}
