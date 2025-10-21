import { createReadStream, createWriteStream, unlinkSync } from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import Stream, { Transform } from "node:stream"
import { pipeline } from "node:stream/promises"

import { internal } from "@hapi/boom"
import { ObjectId } from "bson"
import { AnyBulkWriteOperation } from "mongodb"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import rawRecruteursLbaModel, { ZRecruteursLbaRaw } from "shared/models/rawRecruteursLba.model"

import { logger } from "@/common/logger"
import { getS3FileLastUpdate, s3ReadAsStream } from "@/common/utils/awsUtils"
import { createAssetsFolder, CURRENT_DIR_PATH } from "@/common/utils/fileUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { groupStreamData } from "@/common/utils/streamUtils"
import config from "@/config"
import { isEmailBlacklisted } from "@/services/application.service"

import { recruteursLbaToJobPartners } from "./recruteursLbaMapper"

const require = createRequire(import.meta.url)

const { parser } = require("stream-json")
const { streamArray } = require("stream-json/streamers/StreamArray")

const PREDICTION_FILE_PATH = path.join(CURRENT_DIR_PATH, "./assets/recruteurslba.json")
const S3_FILE = config.algoRecuteursLba.s3File

type BulkOperation = AnyBulkWriteOperation<IComputedJobsPartners>

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

const getRecruteursLbaFileFromS3 = async ({ from, to }: { from: Stream.Readable; to: string }) => {
  logger.info(`Downloading algo file from S3 Bucket to ${to}`)
  await createAssetsFolder()
  const writeStream = createWriteStream(to)

  try {
    await pipeline(from, writeStream)
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

  const validationStream = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const recruteur = { ...chunk.value, createdAt: now, _id: new ObjectId() }
      const parseResult = ZRecruteursLbaRaw.safeParse(recruteur)
      if (!parseResult.success) {
        return callback() // ignore les entrées invalides sans erreur
      }
      callback(null, recruteur)
    },
  })

  const insertionStream = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const filtered = chunk.filter((item) => item)
      if (!filtered.length) {
        callback()
        return
      }
      count += filtered.length
      getDbCollection("raw_recruteurslba").insertMany(filtered)
      callback()
    },
  })

  await pipeline(createReadStream(PREDICTION_FILE_PATH), parser(), streamArray(), validationStream, groupStreamData({ size: 10_000 }), insertionStream)

  const message = `import recruteurs lba terminé : ${count} recruteurs importées`
  logger.info(message)
  await notifyToSlack({
    subject: `import des offres recruteurs lba dans raw`,
    message,
  })
}

export const importRecruteursLbaRaw = async (sourceFileReadStream?: Stream.Readable) => {
  try {
    logger.info(`début de importRecruteursLbaRaw`)
    const readStream = sourceFileReadStream ?? (await s3ReadAsStream("storage", S3_FILE))
    await getRecruteursLbaFileFromS3({ from: readStream, to: PREDICTION_FILE_PATH })
    await importRecruteursLbaToRawCollection()
    logger.info(`fin de importRecruteursLbaRaw`)
  } catch (err) {
    await notifyToSlack({ subject: `import des offres recruteurs lba dans raw`, message: `import recruteurs lba terminé : echec de l'import`, error: true })
    logger.error(err)
    sentryCaptureException(err)
  } finally {
    await removePredictionFile()
  }
}

export const importRecruteurLbaToComputed = async () => {
  const partnerLabel = JOBPARTNERS_LABEL.RECRUTEURS_LBA

  logger.info(`début d'import dans computed_jobs_partners pour partner_label=${partnerLabel}`)
  const counters = { total: 0, success: 0, error: 0 }
  const importDate = new Date()
  const transformStream = new Transform({
    objectMode: true,
    async transform(documents, _encoding, callback) {
      counters.total += documents.length
      if (counters.total % 1000 === 0) logger.info(`processing document ${counters.total}`)

      const operations: BulkOperation[] = []

      for (const document of documents) {
        try {
          const parsedDocument = ZRecruteursLbaRaw.parse(document)
          const { apply_email, apply_phone, updated_at, offer_creation, ...rest } = recruteursLbaToJobPartners(parsedDocument)
          const { workplace_address_zipcode } = rest

          if (workplace_address_zipcode) {
            if (!extensions.zipCode().safeParse(workplace_address_zipcode).success) {
              counters.error++
              continue
            }
          }

          const isEmailBl = apply_email ? await isEmailBlacklisted(apply_email) : false

          operations.push({
            updateOne: {
              filter: { workplace_siret: rest.workplace_siret },
              update: {
                $set: {
                  apply_email: isEmailBl ? null : apply_email,
                  apply_phone,
                  offer_creation,
                  updated_at: importDate,
                },
                $setOnInsert: {
                  ...rest,
                  offer_status_history: [],
                  _id: new ObjectId(),
                },
              },
              upsert: true,
            },
          })

          counters.success++
        } catch (err) {
          counters.error++
          const newError = internal(`error converting raw job to partner_label job for id=${document._id} partner_label=${partnerLabel}`)
          logger.error(newError.message, err)
          logger.error(JSON.stringify(err))
          newError.cause = err
          sentryCaptureException(newError)
        }
      }

      if (operations.length > 0) {
        await getDbCollection("computed_jobs_partners").bulkWrite(operations, { ordered: true })
      }

      callback()
    },
  })

  await pipeline(getDbCollection(rawRecruteursLbaModel.collectionName).find({}).stream(), groupStreamData({ size: 10_000 }), transformStream)

  const message = `import dans computed_jobs_partners pour partner_label=${partnerLabel} terminé. total=${counters.total}, success=${counters.success}, errors=${counters.error}`
  logger.info(message)

  await notifyToSlack({
    subject: `mapping Raw recruteurs LBA => computed_jobs_partners`,
    message,
    error: counters.error > 0,
  })
}

export const removeMissingRecruteursLbaFromComputedJobPartners = async () => {
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

export const removeUnsubscribedRecruteursLbaFromComputedJobPartners = async () => {
  logger.info("debut removeUnsubscribedRecruteursLbaFromComputedJobPartners")
  const results = (await getDbCollection("computed_jobs_partners")
    .aggregate([
      { $match: { partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA } },
      {
        $lookup: {
          from: "unsubscribedrecruteurslba",
          localField: "workplace_siret",
          foreignField: "siret",
          as: "matching",
        },
      },
      { $match: { "matching.0": { $exists: true } } },
      { $project: { _id: 1 } },
    ])
    .toArray()) as IComputedJobsPartners[]

  const idsToRemove = results.map(({ _id }) => _id)

  if (idsToRemove.length) {
    await getDbCollection("computed_jobs_partners").deleteMany({ _id: { $in: idsToRemove } })
  }
  const message = `suppression dans computed_jobs_partners des recruteurs désinscrits terminée. total=${idsToRemove.length}`
  logger.info(message)
  await notifyToSlack({
    subject: `mapping Raw => computed_jobs_partners`,
    message,
  })
}
