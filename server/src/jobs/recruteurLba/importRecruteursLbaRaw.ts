import { createReadStream } from "fs"
import { createRequire } from "module"
import path from "path"

import { ObjectId } from "bson"
import { groupData, oleoduc, transformData, writeData } from "oleoduc"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import rawRecruteursLbaModel, { ZRecruteursLbaRaw } from "shared/models/rawRecruteursLba.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import __dirname from "../../common/dirname"
import { logger } from "../../common/logger"
import { notifyToSlack } from "../../common/utils/slackUtils"
import config from "../../config"
import { rawToComputedJobsPartners } from "../offrePartenaire/rawToComputedJobsPartners"

import { getRecruteursLbaFileFromS3, removePredictionFile } from "./recruteurLbaUtil"
import { recruteursLbaToJobPartners } from "./recruteursLbaMapper"

const require = createRequire(import.meta.url)

const { parser } = require("stream-json")
const { streamArray } = require("stream-json/streamers/StreamArray")

const CURRENT_DIR_PATH = __dirname(import.meta.url)
const PREDICTION_FILE_PATH = path.join(CURRENT_DIR_PATH, "./assets/recruteurslba.json")
const S3_FILE = config.algoRecuteursLba.s3File

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
    logger.info("start importRecruteursLbaRaw")

    await getRecruteursLbaFileFromS3({ from: S3_FILE, to: PREDICTION_FILE_PATH })
    await importRecruteursLbaToRawCollection()

    logger.info("end importRecruteursLbaRaw")

    await notifyToSlack({ subject: "IMPORT SOCIETES ISSUES DE L'ALGO", message: `Import sociétés issues de l'algo terminé avec succès` })
  } catch (err) {
    logger.error(err)
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
