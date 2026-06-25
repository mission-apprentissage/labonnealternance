import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("jobs_partners").updateMany({ ft_support: { $exists: false }, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA }, { $set: { ft_support: false } })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
