import { Db } from "mongodb"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async (_db: Db) => {
  await getDbCollection("recruiters").updateMany(
    { "jobs.managed_by": { $exists: true } },
    { $unset: { "jobs.$[elem].managed_by": "" } },
    {
      arrayFilters: [{ "elem.managed_by": { $exists: true } }],
    }
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
