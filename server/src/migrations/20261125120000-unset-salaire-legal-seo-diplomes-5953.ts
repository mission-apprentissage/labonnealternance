import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

// Fourchettes « 27 % à 100 % du SMIC » figées en base par les migrations #5539 et #5604 (et bts-mco, SMIC 2024).
const FOURCHETTES_LEGALES_PERIMEES = ["504€ - 1 867€", "471€ - 1 767€"]

/**
 * Retire des pages diplôme la fourchette légale apprenti écrite en dur : l'ui la calcule depuis le SMIC en vigueur (#5953).
 * Les fourchettes propres à un diplôme sont conservées.
 */
export const up = async () => {
  const { modifiedCount } = await getDbCollection("seo_diplomes").updateMany(
    { "kpis.salaire": { $in: FOURCHETTES_LEGALES_PERIMEES } },
    { $unset: { "kpis.salaire": "" }, $set: { updated_at: new Date() } },
    { bypassDocumentValidation: true }
  )

  logger.info(`unset salaire legal seo diplomes 5953 : ${modifiedCount} pages diplôme mises à jour`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
