import { createReadStream, createWriteStream, existsSync, mkdirSync, unlinkSync } from "fs"
import { createRequire } from "module"
import { pipeline } from "node:stream/promises"
import path from "path"

import { ObjectId } from "bson"
import { groupData, oleoduc, transformData, writeData } from "oleoduc"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawRecruteursLbaModel, { IRecruteursLbaRaw, ZRecruteursLbaRaw } from "shared/models/rawRecruteursLba.model"

import __dirname from "@/common/dirname"
import { logger } from "@/common/logger"
import { getS3FileLastUpdate, s3ReadAsStream } from "@/common/utils/awsUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"

import { rawToComputedJobsPartners } from "../rawToComputedJobsPartners"

import { recruteursLbaToJobPartners } from "./recruteursLbaMapper"

const require = createRequire(import.meta.url)

const { parser } = require("stream-json")
const { streamArray } = require("stream-json/streamers/StreamArray")

const CURRENT_DIR_PATH = __dirname(import.meta.url)
const PREDICTION_FILE_PATH = path.join(CURRENT_DIR_PATH, "./assets/recruteurslba.json")
const S3_FILE = config.algoRecuteursLba.s3File

export const createAssetsFolder = async () => {
  const assetsPath = path.join(CURRENT_DIR_PATH, "./assets")
  if (!(await existsSync(assetsPath))) {
    await mkdirSync(assetsPath)
  }
}

const removePredictionFile = async () => {
  try {
    logger.info("Deleting downloaded file from assets")
    await unlinkSync(PREDICTION_FILE_PATH)
  } catch (err) {
    logger.error("Error removing company algo file", err)
  }
}

export const checkIfAlgoFileAlreadyProcessed = async (): Promise<boolean> => {
  const algoFileLastModificationDate = await getS3FileLastUpdate("storage", S3_FILE)
  if (!algoFileLastModificationDate) {
    throw new Error("Aucune date de dernière modifications disponible sur le fichier issue de l'algo sur S3.")
  }

  const currentDbCreatedDate = ((await getDbCollection("raw_recruteurslba").findOne({}, { projection: { createdAt: 1 } })) as IRecruteursLbaRaw).createdAt
  if (!currentDbCreatedDate) return false
  if (algoFileLastModificationDate.getTime() < currentDbCreatedDate.getTime()) {
    await notifyToSlack({
      subject: `import des offres recruteurs lba dans raw`,
      message: `dernier fichier en date déjà traité.`,
    })
    return true
  }
  return false
}

const getRecruteursLbaFileFromS3 = async ({ from, to }) => {
  logger.info(`Downloading algo file from S3 Bucket`)
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

const importRecruteursLbaToRawCollection = async () => {
  logger.info("deleting old data")
  await getDbCollection("raw_recruteurslba").deleteMany({})
  logger.info("import starting...")
  let count = 0
  const now = new Date()
  await oleoduc(
    createReadStream(PREDICTION_FILE_PATH),
    parser(),
    streamArray(),
    transformData((doc) => {
      const recruteur = { createdAt: now, _id: new ObjectId(), ...doc.value }
      if (!ZRecruteursLbaRaw.safeParse(recruteur).success) return null
      return recruteur
    }),
    groupData({ size: 10_000 }),
    writeData((array) => {
      const filtered = array.filter((item) => item)
      if (!filtered.length) return
      count += filtered.length
      getDbCollection("raw_recruteurslba").insertMany(filtered)
    })
  )
  const message = `import recruteurs lba terminé : ${count} recruteurs importées`
  logger.info(message)
  notifyToSlack({
    subject: `import des offres recruteurs lba dans raw`,
    message,
  })
}

export const importRecruteursLbaRaw = async () => {
  try {
    await getRecruteursLbaFileFromS3({ from: S3_FILE, to: PREDICTION_FILE_PATH })
    await importRecruteursLbaToRawCollection()
  } catch (err) {
    await notifyToSlack({ subject: `import des offres recruteurs lba dans raw`, message: `import recruteurs lba terminé : echec de l'import`, error: true })
    logger.error(err)
    sentryCaptureException(err)
  } finally {
    await removePredictionFile()
  }
}

export const importRecruteurLbaToComputed = async () => {
  await rawToComputedJobsPartners({
    collectionSource: rawRecruteursLbaModel.collectionName,
    partnerLabel: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
    zodInput: ZRecruteursLbaRaw,
    mapper: recruteursLbaToJobPartners,
  })
}
