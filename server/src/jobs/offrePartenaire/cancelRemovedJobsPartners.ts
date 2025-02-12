import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { JOB_STATUS_ENGLISH } from "shared/models"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const cancelRemovedJobsPartners = async () => {
  const partnerLabelToCancel = Object.values(JOBPARTNERS_LABEL)

  const matchStage = {
    $match: {
      partner_label: { $in: partnerLabelToCancel },
    },
  }
  const setStage = {
    $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE },
  }
  const unsetStage = {
    $unset: "matched",
  }
  const mergeStage = {
    $merge: {
      into: "jobs_partners",
      on: "_id",
      whenMatched: "merge",
      whenNotMatched: "discard",
    },
  }

  const pipeline = [
    matchStage,
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
    setStage,
    unsetStage,
    mergeStage,
  ]

  await getDbCollection("jobs_partners").aggregate(pipeline).toArray()

  const pipeline_expired = [
    matchStage,
    {
      $lookup: {
        from: "computed_jobs_partners",
        let: {
          partnerLabel: "$partner_label",
          partnerJobId: "$partner_job_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$partner_label", "$$partnerLabel"],
                  },
                  {
                    $eq: ["$partner_job_id", "$$partnerJobId"],
                  },
                  {
                    $eq: ["$business_error", BusinessErrorCodes.EXPIRED],
                  },
                ],
              },
            },
          },
        ],
        as: "matched",
      },
    },
    {
      $match: {
        matched: {
          $ne: [],
        },
      },
    },
    setStage,
    unsetStage,
    mergeStage,
  ]

  await getDbCollection("jobs_partners").aggregate(pipeline_expired).toArray()
}
