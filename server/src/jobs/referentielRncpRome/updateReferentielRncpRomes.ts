// @ts-nocheck
import fs from "fs"
import { oleoduc } from "oleoduc"
import path from "path"
import XLSX from "xlsx"
import __dirname from "../../common/dirname.js"
import { logger } from "../../common/logger.js"
import { RncpRomes } from "../../common/model/index.js"
import { getFileFromS3Bucket } from "../../common/utils/awsUtils.js"
import { readXLSXFile } from "../../common/utils/fileUtils.js"

const currentDirname = __dirname(import.meta.url)
const FILEPATH = path.join(currentDirname, "./assets/referentielRncpRome.xlsx")

const downloadAndSaveFile = async (from = "mappingRncpRome") => {
  logger.info(`Downloading and save file ${from} from S3 Bucket...`)

  await oleoduc(getFileFromS3Bucket({ key: from }), fs.createWriteStream(FILEPATH))
}

const saveRncpRomes = async (rncp_code, rome_codes) => {
  const rncpromes = new RncpRomes({ rncp_code, rome_codes })
  await rncpromes.save()
}

export default async function (optionalFileName?: string) {
  logger.info(" -- Start updateReferentielRncpRome -- ")

  await downloadAndSaveFile(optionalFileName)

  console.log("emptying collection rncpromes")
  await RncpRomes.deleteMany({})

  const workbookRncpRomes = readXLSXFile(FILEPATH)

  let codesROMEs = []
  let currentRncpCode

  console.log("parcours fichier xlsx")

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
    return
  }
  return
}
