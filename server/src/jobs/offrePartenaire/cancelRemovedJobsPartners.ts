import { JOB_STATUS_ENGLISH } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const cancelRemovedJobsPartners = async () => {
  const pipeline = [
    {
      $lookup: {
        from: "computed_jobs_partners",
        let: { partnerLabel: "$partner_label", partnerJobId: "$partner_job_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$partner_label", "$$partnerLabel"] }, { $eq: ["$partner_job_id", "$$partnerJobId"] }],
              },
            },
          },
        ],
        as: "matched",
      },
    },
    {
      $match: {
        matched: { $size: 0 },
      },
    },
    {
      $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE },
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

  await getDbCollection("jobs_partners").aggregate(pipeline).toArray()
}
