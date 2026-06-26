import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const LABEL_UPDATES: Array<{ oldLabel: string; newLabel: string }> = [
  { oldLabel: "Cap, autres formations (Infrabac)", newLabel: "CAP, BEP (Infrabac)" },
  { oldLabel: "BP, Bac, autres formations (Bac)", newLabel: "Bac, Bac Pro, BP (Bac)" },
  { oldLabel: "BTS, DEUST, autres formations (Bac+2)", newLabel: "BTS, DEUST (Bac+2)" },
  { oldLabel: "Licence, Maîtrise, autres formations (Bac+3 à Bac+4)", newLabel: "Licence, BUT, Licence Pro (Bac+3)" },
  { oldLabel: "Master, titre ingénieur, autres formations (Bac+5)", newLabel: "Master, titre ingénieur, grande école (Bac+5)" },
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
