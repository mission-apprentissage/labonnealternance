import { Db } from "mongodb"

import { logger } from "@/common/logger"

export const up = async (db: Db) => {
  await db.collection("unsubscribedbonnesboites").dropIndex("opco_1")
  await db.collection("unsubscribedbonnesboites").dropIndex("opco_short_name_1")
  await db.collection("unsubscribedbonnesboites").dropIndex("opco_url_1")
  await db.collection("unsubscribedbonnesboites").updateMany(
    {},
    {
      $unset: {
        username: "",
        email: "",
        phone: "",
        geo_coordinates: "",
        recruitment_potential: "",
        street_number: "",
        street_name: "",
        website: "",
        algorithm_origin: "",
        opco: "",
        opco_short_name: "",
        opco_url: "",
      },
    },
    {
      bypassDocumentValidation: true,
    }
  )

  logger.info("20231211000000-trim-unsubscribed-lbacompanies")
}
