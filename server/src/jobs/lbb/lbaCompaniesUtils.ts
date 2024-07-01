import fs from "fs"
import path from "path"

import { ObjectId } from "mongodb"
import { compose, oleoduc, writeData } from "oleoduc"
import { ILbaCompany } from "shared/models"

import { convertStringCoordinatesToGeoPoint } from "@/common/utils/geolib"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import __dirname from "../../common/dirname"
import { logger } from "../../common/logger"
import { getFileFromS3Bucket, getS3FileLastUpdate, uploadFileToS3 } from "../../common/utils/awsUtils"
// import geoData from "../../common/utils/geoData"
import { notifyToSlack } from "../../common/utils/slackUtils"
import { streamJsonArray } from "../../common/utils/streamUtils"
import config from "../../config"

import initNafMap from "./initNafMap"
import initNafScoreMap from "./initNafScoreMap"

const currentDirname = __dirname(import.meta.url)

const PREDICTION_FILE = path.join(currentDirname, "./assets/bonnesboites.json")
const s3File = config.algoBonnesBoites.s3File

export const createAssetsFolder = async () => {
  const assetsPath = path.join(currentDirname, "./assets")
  if (!(await fs.existsSync(assetsPath))) {
    await fs.mkdirSync(assetsPath)
  }
}

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
export const checkIfAlgoFileIsNew = async (reason: string) => {
  const algoFileLastModificationDate = await getS3FileLastUpdate({ key: s3File })
  // projection to be added, not working when migrated to mongoDB
  const currentDbCreatedDate = ((await getDbCollection("bonnesboites").findOne({})) as ILbaCompany).created_at

  if (algoFileLastModificationDate.getTime() < currentDbCreatedDate.getTime()) {
    await notifyToSlack({
      subject: "IMPORT SOCIETES ISSUES DE L'ALGO",
      message: `Process lié à l'import des sociétés issues de l'algo avorté car les données sont déjà à jour. ${reason}`,
      error: false,
    })
    throw new Error("Sociétés issues de l'algo déjà à jour")
  }
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

export const downloadFile = async ({ from, to }) => {
  await createAssetsFolder()
  await oleoduc(getFileFromS3Bucket({ key: from }), fs.createWriteStream(to))
}

export const readCompaniesFromJson = async () => {
  logger.info(`Reading bonnes boites json`)

  const streamCompanies = async () => {
    const response = fs.createReadStream(PREDICTION_FILE)
    return compose(response, streamJsonArray())
  }

  return streamCompanies()
}

export const countCompaniesInFile = async (): Promise<number> => {
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
export const getCompanyMissingData = async (rawCompany): Promise<ILbaCompany | null> => {
  const company = { _id: new ObjectId(), ...rawCompany }
  const geo = await getGeoLocationForCompany(company)
  if (!geo) {
    return null
  } else {
    company.city = geo.city
    company.zip_code = geo.zip_code
    company.geo_coordinates = geo.geo_coordinates
    company.geopoint = convertStringCoordinatesToGeoPoint(geo.geo_coordinates)
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
      company.opco_url = opcoData.url as string
      company.opco_short_name = opcoData.opco_short_name as string
    }
  }

  company.email = company.email && (await getNotBlacklistedEmail(company.email))

  return company
}

const getNotBlacklistedEmail = async (email) => {
  return (await getDbCollection("emailblacklists").findOne({ email })) ? null : email
}

const getGeoLocationForCompany = async (company) => {
  const geoKey = `${company.street_number} ${company.street_name} ${company.zip_code}`.trim().toUpperCase()

  // a t on déjà une geoloc pour cette adresse
  const result = await getDbCollection("geolocations").findOne({ address: geoKey })

  // si pas de geoloc on en recherche une avec la ban
  // if (!result) {
  //   // @ts-expect-error: TODO
  //   result = await geoData.getFirstMatchUpdates(company)

  //   if (!result) {
  //     return null
  //   } else {
  //     const geoLocation = new GeoLocation({
  //       // @ts-expect-error: TODO
  //       address: geoKey,
  //       ...result,
  //     })
  //     try {
  //       // on enregistre la geoloc trouvée
  //       if (ZGeoLocation.safeParse(geoLocation).success) {
  //         await geoLocation.save()
  //       }
  //     } catch (err) {
  //       //ignore duplicate error
  //     }
  //   }
  // }

  // retour de la geoloc trouvée
  return result
}

const getOpcoForCompany = async (lbaCompany) => {
  const siren = lbaCompany.siret.substring(0, 9)
  return await getDbCollection("opcos").findOne({ siren })
}

let nafScoreMap = {}
let nafMap = {}

export const initMaps = async () => {
  nafScoreMap = await initNafScoreMap()
  nafMap = await initNafMap()
}

const ARBITRARY_ROME_HIRING_THRESHOLD = 0.025
const filterRomesFromNafHirings = (lbaCompany) => {
  const nafRomeHirings = nafScoreMap[lbaCompany.naf_code]
  let filteredRomes = []
  if (nafRomeHirings) {
    filteredRomes = nafRomeHirings.romes.filter((rome) => {
      return nafRomeHirings[rome] / nafRomeHirings.hirings >= ARBITRARY_ROME_HIRING_THRESHOLD
    })
  }

  return filteredRomes
}
