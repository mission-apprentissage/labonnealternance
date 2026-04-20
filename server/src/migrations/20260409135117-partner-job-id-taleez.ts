import fs from "node:fs/promises"
import { ObjectId } from "mongodb"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { parseCsvContent } from "@/common/utils/fileUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"

export const up = async () => {
  logger.info("Starting migration: partner-job-id-taleez")

  const filepath = getStaticFilePath("taleez/export_id_lba_token_taleez.csv")
  const content = (await fs.readFile(filepath)).toString()
  const parsedCsv = await parseCsvContent(content, { delimiter: "," })

  const data = parsedCsv as {
    DATE_PUBLISH: string
    id_lba: string
    token_taleez: string
  }[]

  const counters = {
    updated: 0,
    notFound: 0,
  }
  await asyncForEach(data, async (line) => {
    const { id_lba, token_taleez } = line

    const result = await getDbCollection("jobs_partners").updateOne({ _id: new ObjectId(id_lba), partner_label: "Taleez" }, { $set: { partner_job_id: token_taleez } })

    if (result.matchedCount === 0) {
      counters.notFound++
      logger.warn(`Job partenaire with id_lba ${id_lba} not found`)
    } else {
      counters.updated++
    }
  })

  logger.info(`Migration partner-job-id-taleez completed: ${counters.updated} documents updated, ${counters.notFound} documents not found`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
