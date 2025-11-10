import type { Db } from "mongodb"

import { syncLbaJobsIntoJobsPartners } from "@/jobs/offrePartenaire/lbaJobToJobsPartners"

export const up = async (db: Db) => {
  await syncLbaJobsIntoJobsPartners()

  await db.collection("cfas").updateMany(
    {},
    {
      $unset: { enseigne: "" },
    },
    {
      bypassDocumentValidation: true,
    }
  )
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
