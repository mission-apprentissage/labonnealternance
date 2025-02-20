import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("jobs_partners").updateMany({}, { $set: { duplicates: [] } })
  await getDbCollection("computed_jobs_partners").updateMany({}, { $set: { duplicates: [], jobs_in_success: [] } })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
