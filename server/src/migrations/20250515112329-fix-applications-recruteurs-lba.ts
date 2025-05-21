import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("applications").updateMany(
    { job_title: LBA_ITEM_TYPE.RECRUTEURS_LBA, job_origin: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES },
    { $set: { job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA } }
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
