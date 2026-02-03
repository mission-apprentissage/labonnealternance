import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("jobs_partners").updateMany({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }, { $set: { offer_multicast: true } })
  await getDbCollection("computed_jobs_partners").updateMany({ partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }, { $set: { offer_multicast: true } })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
