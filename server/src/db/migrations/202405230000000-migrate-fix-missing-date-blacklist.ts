import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  // suppression des entrées ne respectant pas la validation email zod
  const emailRegexp = /^([A-Z0-9_+-]+\.?)*[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i
  await db.collection("emailblacklists").deleteMany({ email: { $not: emailRegexp } })

  // restauration du champ created_at pour les entrées qui en sont dépourvues
  const DATE = new Date()
  await db.collection("emailblacklists").updateMany(
    { created_at: { $exists: false } },
    {
      $set: { created_at: DATE },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  await db.collection("applications").updateMany(
    { applicant_email: { $not: emailRegexp } },
    {
      $set: { applicant_email: "faux_email@faux-domaine.fr" },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  logger.info("20240523000000-correction-modeles-lba-2222")
}
