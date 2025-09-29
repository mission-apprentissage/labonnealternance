import { JOB_STATUS_ENGLISH } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("jobs_partners").updateMany(
    { workplace_name: { $in: ["CFA SACEF", "Institut Jules", "ISEC FORMATION SUD", "ISEC FORMATION OUEST", "ISEC FORMATION EST", "ISEC FORMATION NORD", "SYNERGIE OI"] } },
    { $set: { offer_status: JOB_STATUS_ENGLISH.ANNULEE } }
  )
}

export const requireShutdown: boolean = false
