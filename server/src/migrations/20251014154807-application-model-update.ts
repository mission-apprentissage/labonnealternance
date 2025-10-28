import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("applications").updateMany(
    {
      job_id: { $type: "string" },
    },
    [
      {
        $set: {
          job_id: { $toObjectId: "$job_id" },
        },
      },
    ],
    { bypassDocumentValidation: true }
  )

  await getDbCollection("anonymized_applications").updateMany(
    {
      job_id: { $type: "string" },
    },
    [
      {
        $set: {
          job_id: { $toObjectId: "$job_id" },
        },
      },
    ],
    { bypassDocumentValidation: true }
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
