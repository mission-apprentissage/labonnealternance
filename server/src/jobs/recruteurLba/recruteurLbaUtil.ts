import { createWriteStream, existsSync, mkdirSync, unlinkSync } from "fs"
import { pipeline } from "node:stream/promises"
import path from "path"

import { ObjectId } from "mongodb"
import { ILbaCompany } from "shared/models"

import { convertStringCoordinatesToGeoPoint } from "@/common/utils/geolib"
import { isValidEmail } from "@/common/utils/isValidEmail"
import { getDbCollection } from "@/common/utils/mongodbUtils"

import __dirname from "../../common/dirname"
import { logger } from "../../common/logger"
import { getS3FileLastUpdate, s3ReadAsStream } from "../../common/utils/awsUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"
import config from "../../config"

const currentDirname = __dirname(import.meta.url)

const PREDICTION_FILE = path.join(currentDirname, "./assets/recruteurslba.json")
const s3File = config.algoRecuteursLba.s3File

export const createAssetsFolder = async () => {
  const assetsPath = path.join(currentDirname, "./assets")
  if (!(await existsSync(assetsPath))) {
    await mkdirSync(assetsPath)
  }
}

export const removePredictionFile = async () => {
  try {
    logger.info("Deleting downloaded file from assets")
    await unlinkSync(PREDICTION_FILE)
  } catch (err) {
    logger.error("Error removing company algo file", err)
  }
}

/**
 * Check if algo company file is more recent than when last processed
 * @param {string} reason process calling the function
 */
export const checkIfAlgoFileIsNew = async (reason: string) => {
  const algoFileLastModificationDate = await getS3FileLastUpdate("storage", s3File)
  if (!algoFileLastModificationDate) {
    throw new Error("Aucune date de dernière modifications disponible sur le fichier issue de l'algo.")
  }

  const currentDbCreatedDate = ((await getDbCollection("recruteurslba").findOne({}, { projection: { created_at: 1 } })) as ILbaCompany).created_at
  if (algoFileLastModificationDate.getTime() < currentDbCreatedDate.getTime()) {
    await notifyToSlack({
      subject: "IMPORT SOCIETES ISSUES DE L'ALGO",
      message: `Process lié à l'import des sociétés issues de l'algo avorté car les données sont déjà à jour. ${reason}`,
      error: false,
    })
    throw new Error("Sociétés issues de l'algo déjà à jour")
  }
}

export const getRecruteursLbaFileFromS3 = async ({ from, to }) => {
  logger.info(`Downloading algo file ${s3File} from S3 Bucket`)
  await createAssetsFolder()
  const readStream = await s3ReadAsStream("storage", from)
  const writeStream = createWriteStream(to)

  try {
    await pipeline(readStream, writeStream)
    logger.info("File transfer completed successfully")
  } catch (error) {
    logger.error("Error during file transfer:", error)
    throw error
  }
}

/*
Initialize bonneBoite from data, add missing data from maps,
*/
export const getCompanyMissingData = async (rawCompany): Promise<ILbaCompany | null> => {
  const company = { _id: new ObjectId(), created_at: new Date(), last_update_at: new Date(), website: null, opco: null, opco_url: null, opco_short_name: null, ...rawCompany }
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
    return null
  }

  if (!company.opco) {
    const opcoData = await getOpcoForCompany(company)

    if (opcoData) {
      company.opco = opcoData.opco
      company.opco_url = (opcoData.url as string) || null
      company.opco_short_name = (opcoData.opco_short_name as string) || null
    }
  }

  company.email = company.email.trim()
  company.email = (isValidEmail(company.email) && (await getNotBlacklistedEmail(company.email))) || null

  return company
}

const getNotBlacklistedEmail = async (email) => {
  return (await getDbCollection("emailblacklists").findOne({ email })) ? null : email
}

const getGeoLocationForCompany = async (company) => {
  const geoKey = `${company.street_number} ${company.street_name} ${company.zip_code}`.trim().toUpperCase()
  return await getDbCollection("geolocations").findOne({ address: geoKey })
}

const getOpcoForCompany = async (lbaCompany) => {
  const siren = lbaCompany.siret.substring(0, 9)
  return await getDbCollection("opcos").findOne({ siren })
}
