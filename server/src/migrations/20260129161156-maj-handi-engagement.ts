import fs from "node:fs/promises"
import { EntrepriseEngagementSources } from "shared/models/referentielEngagementEntreprise.model"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { parseCsvContent } from "@/common/utils/fileUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getEntrepriseHandiEngagement, upsertEntrepriseHandiEngagement } from "@/services/referentielEngagementEntreprise.service"

export const up = async () => {
  const filepath = getStaticFilePath("referentiel/20260129 Liste handi engages LBA.csv")
  const content = (await fs.readFile(filepath)).toString()
  const parsedCsv = await parseCsvContent(content, { delimiter: "," })
  const data = parsedCsv as {
    SIRET: string
    "source dans le refeEngagement": string
    "Action dev à faire sur ReferentielEngagementEntreprise": string
  }[]

  await asyncForEach(data, async (line) => {
    try {
      const { SIRET: siret } = line
      const actionDev = line["Action dev à faire sur ReferentielEngagementEntreprise"]
      if (actionDev === `Ajouter le SIRET avec le champ Engagement à "handicap" et source à "France-travail"`) {
        await upsertEntrepriseHandiEngagement({
          siret,
          sources: [EntrepriseEngagementSources.FRANCE_TRAVAIL],
        })
      } else if (actionDev === "Rien à faire") {
        // do nothing
      } else if (actionDev === `Ajouter dans le champ source "france-travail" et màj le champ "Updated At" `) {
        const storedEngagement = await getEntrepriseHandiEngagement(siret)
        if (!storedEngagement) {
          throw new Error(`inattendu: pas d'engagement pour siret=${siret}`)
        }
        const sources = storedEngagement.sources.concat([EntrepriseEngagementSources.FRANCE_TRAVAIL])
        await upsertEntrepriseHandiEngagement({
          siret,
          sources,
        })
      }
    } catch (err) {
      logger.error("error when treating line", line)
      logger.error(err)
    }
  })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
