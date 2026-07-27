import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const ORIGIN_MAPPING: Record<string, string> = {
  "1J1S": "1jeune1solution",
  redirec_from_widget_1j1s: "1jeune1solution",
  lba: "Labonnealternance",
  "": "Labonnealternance",
  tutorial: "Labonnealternance",
  matcha: "Labonnealternance",
  "création par l'interface admin": "Labonnealternance",
  portailalternance: "Portaildel'alternance",
  portailalt: "Portaildel'alternance",
  "opcoep-CRM": "OPCOEP",
  "opcoep-HUBE": "OPCOEP",
  "opcoep-proximite2023": "OPCOEP",
  "campagne-jeunes-sans-contrat-opcoEP-novembre2022": "OPCOEP",
  "user migration": "usermigration",
  akto: "OPCOAkto",
  "lesentreprises-sengagent": "Lesentreprisess'engagent",
  redirec_from_widget_lesentreprisessengagent: "Lesentreprisess'engagent",
  opco2i: "OPCO2i",
  atlas: "OPCOAtlas",
  sante: "OPCOSanté",
  constructys: "OPCOConstructys",
}

export const up = async () => {
  logger.info("Normalizing userswithaccounts.origin values")

  for (const [from, to] of Object.entries(ORIGIN_MAPPING)) {
    const filter = from === "" ? { $or: [{ origin: "" }, { origin: null }, { origin: { $exists: false } }] } : { origin: from }
    const result = await getDbCollection("userswithaccounts").updateMany(filter, { $set: { origin: to } }, { bypassDocumentValidation: true })
    if (result.modifiedCount > 0) {
      logger.info(`origin "${from}" → "${to}" : ${result.modifiedCount} documents mis à jour`)
    }
  }

  logger.info("userswithaccounts.origin normalization done")
}

export const requireShutdown: boolean = false
