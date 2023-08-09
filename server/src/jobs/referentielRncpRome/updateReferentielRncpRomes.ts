import fs from "fs"
import { oleoduc } from "oleoduc"
import path from "path"
import XLSX from "xlsx"
import __dirname from "../../common/dirname.js"
import { logger } from "../../common/logger.js"
import { RncpRomes } from "../../db/index.js"
import { getFileFromS3Bucket } from "../../common/utils/awsUtils.js"
import { readXLSXFile } from "../../common/utils/fileUtils.js"

const currentDirname = __dirname(import.meta.url)
const FILEPATH = path.join(currentDirname, "../../assets/referentielRncpRome.xlsx")

/**
 * Fait une copie locale du fichier source depuis le repository
 * @param {string} from fichier source alternatif
 * @returns {Promise<void>}
 */
const downloadAndSaveFile = async (from = "mappingRncpRome"): Promise<void> => {
  logger.info(`Downloading and save file ${from} from S3 Bucket...`)

  await oleoduc(getFileFromS3Bucket({ key: from }), fs.createWriteStream(FILEPATH))
}

/**
 * Enregistre une combinaison RNCP / codes ROME dans la mongo
 * @param {string} rncp_code
 * @param {string[]} rome_codes
 * @returns {Promise<void>}
 */
const saveRncpRomes = async (rncp_code: string, rome_codes: string[]): Promise<void> => {
  const rncpromes = new RncpRomes({ rncp_code, rome_codes })
  await rncpromes.save()
}

/**
 * Alimente la collection rncpromes à partir du fichier source
 * @param {string} optionalFileName le nom d'un fichier alternatif au fichier source par défaut sur le repository
 */
export default async function (optionalFileName?: string) {
  logger.info(" -- Start updateReferentielRncpRome -- ")

  await downloadAndSaveFile(optionalFileName)

  logger.info("emptying collection rncpromes")
  await RncpRomes.deleteMany({})

  const workbookRncpRomes = readXLSXFile(FILEPATH)

  let codesROMEs = []
  let currentRncpCode

  logger.info("parcours fichier xlsx")

  const onglet = XLSX.utils.sheet_to_json(workbookRncpRomes.workbook.Sheets["Feuil3"])

  try {
    for (let i = 0; i < onglet.length; i++) {
      const row = onglet[i]

      if (row["RNCP"] !== currentRncpCode) {
        if (currentRncpCode && codesROMEs.length) {
          await saveRncpRomes(currentRncpCode, codesROMEs)
        }
        currentRncpCode = row["RNCP"]
        codesROMEs = [row["ROME"]]
      } else {
        codesROMEs.push(row["ROME"])
      }
    }
    await saveRncpRomes(currentRncpCode, codesROMEs)

    logger.info("Suppression fichier depuis les assets")
    await fs.unlinkSync(FILEPATH)

    logger.info(`Fin traitement`)
  } catch (error) {
    logger.error(error)
  }
  return
}
