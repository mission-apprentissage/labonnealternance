import { createReadStream, createWriteStream, existsSync, mkdirSync, unlinkSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import { Transform } from "node:stream"
import { pipeline } from "node:stream/promises"

import { internal } from "@hapi/boom"
import { ObjectId } from "bson"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import rawRecruteursLbaModel, { ZRecruteursLbaRaw } from "shared/models/rawRecruteursLba.model"

import __dirname from "@/common/dirname"
import { logger } from "@/common/logger"
import { getS3FileLastUpdate, s3ReadAsStream } from "@/common/utils/awsUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"

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

  const recruteurLbaRaw = await getDbCollection("raw_recruteurslba").findOne({}, { projection: { createdAt: 1 } })
  if (!recruteurLbaRaw) return false
  if (algoFileLastModificationDate.getTime() < recruteurLbaRaw.createdAt.getTime()) {
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

  const now = new Date()
  let count = 0

  // Buffer batch de 10 000 éléments
  let batch: any[] = []

  // Transform stream pour parser et filtrer avec Zod
  const transformStream = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        const recruteur = { createdAt: now, _id: new ObjectId(), ...chunk.value }
        if (!ZRecruteursLbaRaw.safeParse(recruteur).success) {
          return callback() // ignore les entrées invalides sans erreur
        }
        batch.push(recruteur)
        if (batch.length >= 10_000) {
          // insert batch dans la DB, puis vider le batch
          getDbCollection("raw_recruteurslba")
            .insertMany(batch)
            .then(() => {
              count += batch.length
              batch = []
              callback()
            })
            .catch((err) => callback(err))
        } else {
          callback()
        }
      } catch (err: any) {
        callback(err)
      }
    },
    final(callback) {
      // Insertion du dernier batch restant
      if (batch.length > 0) {
        getDbCollection("raw_recruteurslba")
          .insertMany(batch)
          .then(() => {
            count += batch.length
            batch = []
            callback()
          })
          .catch((err) => callback(err))
      } else {
        callback()
      }
    },
  })

  await pipeline(createReadStream(PREDICTION_FILE_PATH), parser(), streamArray(), transformStream)

  const message = `import recruteurs lba terminé : ${count} recruteurs importées`
  logger.info(message)
  await notifyToSlack({
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
  const collectionSource = rawRecruteursLbaModel.collectionName
  const partnerLabel = JOBPARTNERS_LABEL.RECRUTEURS_LBA
  const zodInput = ZRecruteursLbaRaw
  const mapper = recruteursLbaToJobPartners

  logger.info(`début d'import dans computed_jobs_partners pour partner_label=${partnerLabel}`)
  const counters = { total: 0, success: 0, error: 0 }
  const importDate = new Date()

  const transformStream = new Transform({
    objectMode: true,
    async transform(document, _encoding, callback) {
      counters.total++
      try {
        const parsedDocument = zodInput.parse(document)
        const { apply_email, apply_phone, updated_at, ...rest } = mapper(parsedDocument)

        await getDbCollection("computed_jobs_partners").updateOne(
          { workplace_siret: rest.workplace_siret },
          {
            $set: {
              apply_email,
              apply_phone,
              updated_at: importDate,
            },
            $setOnInsert: {
              ...rest,
              offer_status_history: [],
              _id: new ObjectId(),
            },
          },
          { upsert: true }
        )

        counters.success++
        callback()
      } catch (err) {
        counters.error++
        const newError = internal(`error converting raw job to partner_label job for id=${document._id} partner_label=${partnerLabel}`)
        logger.error(newError.message, err)
        newError.cause = err
        sentryCaptureException(newError)
        callback()
      }
    },
  })

  await pipeline(getDbCollection(collectionSource).find({}).stream(), transformStream)

  const message = `import dans computed_jobs_partners pour partner_label=${partnerLabel} terminé. total=${counters.total}, success=${counters.success}, errors=${counters.error}`
  logger.info(message)

  await notifyToSlack({
    subject: `mapping Raw => computed_jobs_partners`,
    message,
    error: counters.error > 0,
  })
}

export const removeMissingRecruteursLbaFromRaw = async () => {
  logger.info("clean-up recruteurs_lba in computed_jobs_partners from raw")
  const results = (await getDbCollection("computed_jobs_partners")
    .aggregate([
      { $match: { partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA } },
      {
        $lookup: {
          from: "raw_recruteurslba",
          localField: "workplace_siret",
          foreignField: "siret",
          as: "matching",
        },
      },
      { $match: { matching: { $size: 0 } } },
      { $project: { _id: 1 } },
    ])
    .toArray()) as IComputedJobsPartners[]

  const idsToRemove = results.map(({ _id }) => _id)

  if (idsToRemove.length) {
    await getDbCollection("computed_jobs_partners").deleteMany({ _id: { $in: idsToRemove } })
  }
  const message = `clean-up dans computed_jobs_partners pour partner_label=${JOBPARTNERS_LABEL.RECRUTEURS_LBA} terminé. total=${idsToRemove.length}`
  logger.info(message)
  await notifyToSlack({
    subject: `mapping Raw => computed_jobs_partners`,
    message,
  })
}
