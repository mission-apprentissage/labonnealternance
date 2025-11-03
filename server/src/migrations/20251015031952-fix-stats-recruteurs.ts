import { getDatabase } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDatabase()
    .collection("jobs_partners")
    .updateMany({ stats_detail_view: null }, { $set: { stats_detail_view: 0 } })
  await getDatabase()
    .collection("jobs_partners")
    .updateMany({ stats_search_view: null }, { $set: { stats_search_view: 0 } })
  await getDatabase()
    .collection("jobs_partners")
    .updateMany({ stats_postuler: null }, { $set: { stats_postuler: 0 } })
}

export const requireShutdown: boolean = true
