import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  await db.collection("applications").updateMany(
    { company_naf: null },
    { $set: { company_naf: "" } },
    {
      // @ts-expect-error bypassDocumentValidation is not properly set in @types/mongodb
      bypassDocumentValidation: true,
    }
  )

  await db.collection("applications").updateMany(
    { job_title: null },
    { $set: { job_title: "" } },
    {
      // @ts-expect-error bypassDocumentValidation is not properly set in @types/mongodb
      bypassDocumentValidation: true,
    }
  )

  await db.collection("bonnesboites").deleteMany(
    { naf_label: null },
    {
      // @ts-expect-error bypassDocumentValidation is not properly set in @types/mongodb
      bypassDocumentValidation: true,
    }
  )

  logger.info("20231120000000-cleaning_applications")
}
