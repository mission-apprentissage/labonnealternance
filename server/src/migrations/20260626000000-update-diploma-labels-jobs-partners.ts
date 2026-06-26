import { NIVEAU_DIPLOME_LABEL } from "shared/constants/recruteur"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const LABEL_UPDATES: Array<{ oldLabel: string; newLabel: string }> = [
  { oldLabel: "Cap, autres formations (Infrabac)", newLabel: NIVEAU_DIPLOME_LABEL["3"] },
  { oldLabel: "BP, Bac, autres formations (Bac)", newLabel: NIVEAU_DIPLOME_LABEL["4"] },
  { oldLabel: "BTS, DEUST, autres formations (Bac+2)", newLabel: NIVEAU_DIPLOME_LABEL["5"] },
  { oldLabel: "Licence, Maîtrise, autres formations (Bac+3 à Bac+4)", newLabel: NIVEAU_DIPLOME_LABEL["6"] },
  { oldLabel: "Master, titre ingénieur, autres formations (Bac+5)", newLabel: NIVEAU_DIPLOME_LABEL["7"] },
]

export const up = async () => {
  for (const { oldLabel, newLabel } of LABEL_UPDATES) {
    const jobsResult = await getDbCollection("jobs_partners").updateMany({ "offer_target_diploma.label": oldLabel }, { $set: { "offer_target_diploma.label": newLabel } })
    logger.info(`jobs_partners: "${oldLabel}" → "${newLabel}" — ${jobsResult.modifiedCount} updated`)

    const computedResult = await getDbCollection("computed_jobs_partners").updateMany(
      { "offer_target_diploma.label": oldLabel },
      { $set: { "offer_target_diploma.label": newLabel } }
    )
    logger.info(`computed_jobs_partners: "${oldLabel}" → "${newLabel}" — ${computedResult.modifiedCount} updated`)
  }
}

export const requireShutdown: boolean = false
