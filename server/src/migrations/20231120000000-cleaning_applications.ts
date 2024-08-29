import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  await db.collection("applications").updateMany(
    { company_naf: null },
    { $set: { company_naf: "" } },
    {
      bypassDocumentValidation: true,
    }
  )

  await db.collection("applications").updateMany(
    { job_title: null },
    { $set: { job_title: "" } },
    {
      bypassDocumentValidation: true,
    }
  )

  // removing unreachable lbacompanies
  await db.collection("bonnesboites").deleteMany({ naf_label: null })

  // removing buggy line
  await db.collection("domainesmetiers").deleteMany({ domaine: null })

  logger.info("20231120000000-cleaning_applications")
}
