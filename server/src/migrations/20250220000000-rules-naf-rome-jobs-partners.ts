import { JOB_STATUS_ENGLISH } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("jobs_partners").updateMany(
    { workplace_naf_code: RegExp("^85"), offer_status: JOB_STATUS_ENGLISH.ACTIVE },
    { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE } }
  )
  await getDbCollection("jobs_partners").updateMany(
    { offer_status: JOB_STATUS_ENGLISH.ACTIVE, offer_rome_codes: { $in: ["K2202", "G1605", "I1201", "L1102", "N4104"] } },
    { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE } }
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
