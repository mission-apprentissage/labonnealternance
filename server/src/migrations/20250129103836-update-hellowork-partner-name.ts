import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("computed_jobs_partners").updateMany({ partner_label: "Hello work" }, { $set: { partner_label: "Hellowork" } })
  await getDbCollection("jobs_partners").updateMany({ partner_label: "Hello work" }, { $set: { partner_label: "Hellowork" } })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = true
