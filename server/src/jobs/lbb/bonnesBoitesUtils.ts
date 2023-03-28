// @ts-nocheck
import AWS from "aws-sdk"
import memoize from "memoizee"
import { getFileFromS3Bucket, uploadFileToS3 } from "../../common/utils/awsUtils.js"
import { streamJsonArray } from "../../common/utils/streamUtils.js"
import { logger } from "../../common/logger.js"
import fs from "fs"
import path from "path"
import config from "../../config.js"
import __dirname from "../../common/dirname.js"
import { compose, oleoduc } from "oleoduc"
import geoData from "../../common/utils/geoData.js"
import { EmailBlacklist, BonnesBoites, GeoLocation, Opco } from "../../common/model/index.js"
import initNafMap from "./initNafMap.js"
import initNafScoreMap from "./initNafScoreMap.js"
import { OPCOS } from "../../common/constants.js"

const currentDirname = __dirname(import.meta.url)

const PREDICTION_FILE = path.join(currentDirname, "../../assets/bonnesboites.json")
const accessKeyId = config.algoBonnesBoites.accessKeyId
const secretAccessKey = config.algoBonnesBoites.secretAccessKey
const s3Endpoint = config.algoBonnesBoites.s3Endpoint
const s3Region = config.algoBonnesBoites.s3Region
const s3Bucket = config.algoBonnesBoites.s3Bucket
const s3File = config.algoBonnesBoites.s3File

export const removePredictionFile = async () => {
  try {
    logger.info("Deleting downloaded file frome assets")
    await fs.unlinkSync(PREDICTION_FILE)
  } catch (err) {
    logger.error("Error removing company algo file", err)
  }
}

export const pushFileToBucket = async ({ key, filePath }) => {
  logger.info(`Uploading SAVE file ${key} to S3 Bucket...`)

  AWS.config.update({
    accessKeyId,
    secretAccessKey,
  })

  const s3Repository = new AWS.S3({ endpoint: s3Endpoint, region: s3Region })

  await uploadFileToS3({ s3Repository, filePath, key, bucket: s3Bucket })
}

export const downloadAlgoCompanyFile = async () => {
  logger.info(`Downloading algo file ${s3File} from S3 Bucket...`)

  await downloadFile({ from: s3File, to: PREDICTION_FILE })
}

export const downloadSAVEFile = async ({ key }) => {
  logger.info(`Downloading SAVE file ${key} from S3 Bucket...`)

  await downloadFile({ from: key, to: path.join(currentDirname, `../../assets/${key}`) })
}

export const downloadFile = async ({ from, to }) => {
  AWS.config.update({
    accessKeyId,
    secretAccessKey,
  })

  const s3Repository = new AWS.S3({ endpoint: s3Endpoint, region: s3Region })

  await oleoduc(getFileFromS3Bucket({ s3Repository, bucket: s3Bucket, key: from }), fs.createWriteStream(to))
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

/*
Initialize bonneBoite from data, add missing data from maps, 
*/
export const getCompanyMissingData = async (rawCompany) => {
  let company = await BonnesBoites.findOne({ siret: rawCompany.siret })

  if (!company) {
    company = new BonnesBoites(rawCompany)
  }

  const geo = await getGeoLocationForCompany(company)

  if (!company.geo_coordinates) {
    if (!geo) {
      return null
    } else {
      company.city = geo.city
      company.zip_code = geo.zip_code
      company.geo_coordinates = geo.geo_coordinates
    }
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

  const opcoData = await getOpcoForCompany(company)

  if (opcoData) {
    company.opco = opcoData.opco
    company.opco_url = opcoData.url
    company.opco_short_name = opcoData.opco_short_name
  }

  let companyAvant = company.email
  company.email = company.email && (await getNotBlacklistedEmail(company.email))
  let companyApres = company.email

  if(companyApres!==companyAvant)
  {
    console.log("Email filtré : ",companyAvant,companyApres)
  }

  return company
}

const getNotBlacklistedEmail = async (email) => {
  return (await EmailBlacklist.findOne({ email })) ? null : email
}

const getGeoLocationForCompany = async (company) => {
  if (!company.geo_coordinates) {
    const geoKey = `${company.street_number} ${company.street_name} ${company.zip_code}`.trim().toUpperCase()

    let result = await GeoLocation.findOne({ address: geoKey })

    if (!result) {
      result = await geoData.getFirstMatchUpdates(company)

      if (result) {
        const geoLocation = new GeoLocation({
          address: geoKey,
          ...result,
        })
        try {
          await geoLocation.save()
        } catch (err) {
          //ignore duplicate error
        }
      } else {
        return null
      }
    }

    return result
  } else return null
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

const getOpcoShortName = (longName) => {
  return Object.keys(OPCOS).find((k) => OPCOS[k] === longName)
}

export const getMemoizedOpcoShortName = memoize(getOpcoShortName)
