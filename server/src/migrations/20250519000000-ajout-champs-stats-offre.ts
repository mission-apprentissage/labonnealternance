import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("jobs_partners").updateMany(
    {},
    {
      $set: {
        stats_detail_view: 0,
        stats_search_view: 0,
        stats_postuler: 0,
      },
    }
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
