import { getDbCollection } from "@/common/utils/mongodbUtils"
import { anonymizeApplicationProjection } from "@/jobs/anonymization/anonymizeApplications"

export const up = async () => {
  const filterStages = [
    {
      $lookup: {
        from: "applicants",
        localField: "applicant_id",
        foreignField: "_id",
        as: "matches",
      },
    },
    {
      $match: {
        "matches.0": {
          $exists: false,
        },
      },
    },
  ]
  await getDbCollection("applications")
    .aggregate([
      ...filterStages,
      {
        $project: anonymizeApplicationProjection,
      },
      {
        $merge: "anonymized_applications",
      },
    ])
    .toArray()
  const idsToDelete = await getDbCollection("applications")
    .aggregate([
      ...filterStages,
      {
        $project: { _id: 1 },
      },
    ])
    .toArray()
  await getDbCollection("applications").deleteMany({ _id: { $in: idsToDelete.map(({ _id }) => _id) } })
}
