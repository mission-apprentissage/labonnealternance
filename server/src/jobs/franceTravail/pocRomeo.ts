import { logger } from "@/common/logger"

import { IRomeoPayload, getRomeoPredictions } from "../../common/apis/franceTravail/franceTravail.client"
import { getDbCollection } from "../../common/utils/mongodbUtils"

export const pocRomeo = async () => {
  const rawHelloworkDocuments = await getDbCollection("raw_hellowork")
    .find({}, { projection: { "job.title": 1, "job.company_sector": 1 } })
    .limit(3)
    .toArray()
  const dataset: IRomeoPayload[] = rawHelloworkDocuments.map((document) => {
    const { _id } = document
    const job = document.job as any
    return {
      intitule: job.title,
      identifiant: _id.toString(),
      contexte: job.company_sector,
    }
  })
  const romeoResult = await getRomeoPredictions(dataset)
  logger.info(romeoResult)
}
