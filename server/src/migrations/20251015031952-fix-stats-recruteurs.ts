import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("jobs_partners").updateMany({ stats_detail_view: null }, { $set: { stats_detail_view: 0 } })
}

export const requireShutdown: boolean = true
