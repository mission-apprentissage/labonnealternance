import fs from "node:fs/promises"
import { EntrepriseEngagementSources } from "shared/models/referentielEngagementEntreprise.model"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { parseCsvContent } from "@/common/utils/fileUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getEntrepriseHandiEngagement, upsertEntrepriseHandiEngagement } from "@/services/referentielEngagementEntreprise.service"

export const up = async () => {
  const filepath = getStaticFilePath("referentiel/20260423 Liste employeurs reconnus handi engages.csv")
  const content = (await fs.readFile(filepath)).toString()
  const parsedCsv = await parseCsvContent(content, { delimiter: "," })
  const data = parsedCsv as {
    SIRET: string
    action: string
  }[]

  let processed = 0
  let missingForAddSource = 0
  const errors: string[] = []

  await asyncForEach(data, async (line) => {
    try {
      const { SIRET: siret, action } = line
      if (action === "ajout du SIRET avec comme source FT") {
        await upsertEntrepriseHandiEngagement({
          siret,
          sources: [EntrepriseEngagementSources.FRANCE_TRAVAIL],
        })
        processed++
      } else if (action === "ajouter FT en tant que source") {
        const storedEngagement = await getEntrepriseHandiEngagement(siret)
        const sources = storedEngagement ? storedEngagement.sources.concat([EntrepriseEngagementSources.FRANCE_TRAVAIL]) : [EntrepriseEngagementSources.FRANCE_TRAVAIL]
        if (!storedEngagement) {
          missingForAddSource++
        }
        await upsertEntrepriseHandiEngagement({ siret, sources })
        processed++
      }
    } catch (err) {
      logger.error("error when treating line", line)
      logger.error(err)
      errors.push(line.SIRET)
    }
  })

  logger.info(
    `maj-handi-engagement-avril-2026: ${processed} upserted, ${missingForAddSource} missing documents upserted as new for action "ajouter FT en tant que source", ${errors.length} errors`
  )
  if (errors.length) {
    logger.warn(`maj-handi-engagement-avril-2026: SIRETs in error: ${errors.join(", ")}`)
  }
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
