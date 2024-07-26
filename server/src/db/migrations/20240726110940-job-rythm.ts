import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("recruiters").updateMany({ "jobs.job_rythm": null }, { $set: { "jobs.$.job_rythm": null } })
}
