// @ts-nocheck
import { getFileFromS3Bucket, getS3FileLastUpdate, uploadFileToS3 } from "../../common/utils/awsUtils.js"
import { streamJsonArray } from "../../common/utils/streamUtils.js"
import { logger } from "../../common/logger.js"
import fs from "fs"
import path from "path"
import config from "../../config.js"
import __dirname from "../../common/dirname.js"
import { compose, oleoduc, writeData } from "oleoduc"
import geoData from "../../common/utils/geoData.js"
import { EmailBlacklist, LbaCompany, GeoLocation, Opco } from "../../common/model/index.js"
import initNafMap from "./initNafMap.js"
import initNafScoreMap from "./initNafScoreMap.js"
import { notifyToSlack } from "../../common/utils/slackUtils.js"

const currentDirname = __dirname(import.meta.url)

const PREDICTION_FILE = path.join(currentDirname, "../../assets/bonnesboites.json")
const s3File = config.algoBonnesBoites.s3File

export const removePredictionFile = async () => {
  try {
    logger.info("Deleting downloaded file from assets")
    await fs.unlinkSync(PREDICTION_FILE)
  } catch (err) {
    logger.error("Error removing company algo file", err)
  }
}

/**
 * Check if algo company file is more recent than when last processed
 * @param {string} reason process calling the function
 */
export const checkIfAlgoFileIsNew = async (reason: string): void => {
  const algoFileLastModificationDate = await getFileLastModificationDate()
  const currentDbCreatedDate = await getCurrentDbCreatedDate()

  if (algoFileLastModificationDate.getTime() < currentDbCreatedDate.getTime()) {
    await notifyToSlack({
      subject: "IMPORT BONNES BOITES",
      message: `Process lié à l'import bonnesboites avorté car les données sont déjà à jour. ${reason}`,
      error: false,
    })
    throw new Error("Sociétés issues de l'algo déjà à jour")
  }
}

const getCurrentDbCreatedDate = async (): Date => {
  return (await LbaCompany.findOne({}).select({ created_at: 1, _id: 0 })).created_at
}

const getFileLastModificationDate = async (): Date => {
  return await getS3FileLastUpdate({ key: s3File })
}

export const pushFileToBucket = async ({ key, filePath }) => {
  logger.info(`Uploading SAVE file ${key} to S3 Bucket...`)

  await uploadFileToS3({ filePath, key })
}

/**
 * Télécharge localement le fichier des sociétés issues de l'algo
 * @param {string | null} sourceFile un fichier source alternatif
 */
export const downloadAlgoCompanyFile = async (sourceFile: string | null) => {
  logger.info(`Downloading algo file ${sourceFile || s3File} from S3 Bucket...`)

  await downloadFile({ from: sourceFile || s3File, to: PREDICTION_FILE })
}

export const downloadSAVEFile = async ({ key }) => {
  logger.info(`Downloading SAVE file ${key} from S3 Bucket...`)

  await downloadFile({ from: key, to: path.join(currentDirname, `../../assets/${key}`) })
}

export const downloadFile = async ({ from, to }) => {
  await oleoduc(getFileFromS3Bucket({ key: from }), fs.createWriteStream(to))
}

export const streamSAVECompanies = async ({ key }) => {
  const response = fs.createReadStream(path.join(currentDirname, `../../assets/${key}`))
  return compose(response, streamJsonArray())
}

export const readCompaniesFromJson = async () => {
  logger.info(`Reading bonnes boites json`)

  const streamCompanies = async () => {
    const response = fs.createReadStream(PREDICTION_FILE)
    return compose(response, streamJsonArray())
  }

  return streamCompanies()
}

export const countCompaniesInFile = async (): number => {
  let count = 0
  await oleoduc(
    await readCompaniesFromJson(),
    writeData(() => {
      count++
    })
  )
  return count
}

/*
Initialize bonneBoite from data, add missing data from maps, 
*/
export const getCompanyMissingData = async (rawCompany) => {
  const company = new LbaCompany(rawCompany)
  const geo = await getGeoLocationForCompany(company)
  if (!geo) {
    return null
  } else {
    company.city = geo.city
    company.zip_code = geo.zip_code
    company.geo_coordinates = geo.geo_coordinates
  }

  if (rawCompany.rome_codes) {
    company.rome_codes = rawCompany.rome_codes.map((rome) => rome.rome_code)
  } else {
    // cas SAVE add, rome_codes à déduire du code naf
    // filtrage des éléments inexploitables
    company.rome_codes = await filterRomesFromNafHirings(rawCompany)
    if (company.rome_codes.length === 0) {
      return null
    }
    if (!rawCompany.naf_label) {
      company.naf_label = nafMap[rawCompany.naf_code]
    }
  }

  if (!company.opco) {
    const opcoData = await getOpcoForCompany(company)

    if (opcoData) {
      company.opco = opcoData.opco
      company.opco_url = opcoData.url
      company.opco_short_name = opcoData.opco_short_name
    }
  }

  company.email = company.email && (await getNotBlacklistedEmail(company.email))

  return company
}

const getNotBlacklistedEmail = async (email) => {
  return (await EmailBlacklist.findOne({ email })) ? null : email
}

const getGeoLocationForCompany = async (company) => {
  const geoKey = `${company.street_number} ${company.street_name} ${company.zip_code}`.trim().toUpperCase()

  // a t on déjà une geoloc pour cette adresse
  let result = await GeoLocation.findOne({ address: geoKey })

  // si pas de geoloc on en recherche une avec la ban
  if (!result) {
    result = await geoData.getFirstMatchUpdates(company)

    if (!result) {
      return null
    } else {
      const geoLocation = new GeoLocation({
        address: geoKey,
        ...result,
      })
      try {
        // on enregistre la geoloc trouvée
        await geoLocation.save()
      } catch (err) {
        //ignore duplicate error
      }
    }
  }

  // retour de la geoloc trouvée
  return result
}

const getOpcoForCompany = async (bonneBoite) => {
  const siren = bonneBoite.siret.substring(0, 9)
  return await Opco.findOne({ siren })
}

let nafScoreMap = {}
let nafMap = {}

export const initMaps = async () => {
  nafScoreMap = await initNafScoreMap()
  nafMap = await initNafMap()
}

const ARBITRARY_ROME_HIRING_THRESHOLD = 0.025
const filterRomesFromNafHirings = (bonneBoite) => {
  const nafRomeHirings = nafScoreMap[bonneBoite.naf_code]
  let filteredRomes = []
  if (nafRomeHirings) {
    filteredRomes = nafRomeHirings.romes.filter((rome) => {
      return nafRomeHirings[rome] / nafRomeHirings.hirings >= ARBITRARY_ROME_HIRING_THRESHOLD
    })
  }

  return filteredRomes
}
