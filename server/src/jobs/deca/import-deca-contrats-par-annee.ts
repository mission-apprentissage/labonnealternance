import type { Readable } from "node:stream"
import { Transform } from "node:stream"
import { pipeline } from "node:stream/promises"

import type { AnyBulkWriteOperation } from "mongodb"
import { MongoBulkWriteError, ObjectId } from "mongodb"
import type { IDecaContrats } from "shared/models/deca-contrats.model"
import { validateSIRET } from "shared/validators/siret-validator"

import { logger } from "@/common/logger"
import { s3ReadAsStream } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { groupStreamData, ndjsonToObjectStream } from "@/common/utils/stream-utils"

const S3_KEY = "siretlist/lba_deca_contrats_par_annee.ndjson"
const BULK_WRITE_BATCH_SIZE = 10_000

// Format constaté (fichier DECA - Dépôt des Contrats d'Alternance) : une entrée par ligne, ex.
// { "siret": "00552017600016", "contrats_par_annee": { "2023": 2 } }
type DecaContratsParAnneeDocument = {
  siret: string
  contrats_par_annee: Record<string, number>
}

export const importDecaContratsParAnnee = async () => {
  logger.info(`importDecaContratsParAnnee: téléchargement de ${S3_KEY}`)

  let sourceStream: Readable
  try {
    sourceStream = await s3ReadAsStream("storage", S3_KEY)
  } catch (err) {
    logger.error({ err }, `importDecaContratsParAnnee: échec de la lecture du fichier S3 (${S3_KEY})`)
    return
  }

  const now = new Date()
  const counters = { total: 0, upserted: 0, errors: 0 }

  const parseStream = ndjsonToObjectStream((err, line) => {
    counters.errors++
    logger.error({ err, line }, "importDecaContratsParAnnee: ligne ndjson non parsable")
  })

  // Regroupe les documents parsés par lots avant d'écrire, pour limiter le nombre d'aller-retours Mongo
  // sur un fichier de plusieurs centaines de milliers de lignes (cf. import-recruteurs-lba-raw.ts).
  const bulkUpsertStream = new Transform({
    objectMode: true,
    async transform(documents: DecaContratsParAnneeDocument[], _encoding, callback) {
      counters.total += documents.length
      if (counters.total % 50_000 === 0) {
        logger.info(`importDecaContratsParAnnee: ${counters.total} documents traités`)
      }

      const operations: AnyBulkWriteOperation<IDecaContrats>[] = []
      for (const document of documents) {
        if (!document?.siret || !validateSIRET(document.siret)) {
          counters.errors++
          continue
        }
        operations.push({
          updateOne: {
            filter: { siret: document.siret },
            update: {
              $set: { contrats_par_annee: document.contrats_par_annee, updated_at: now },
              $setOnInsert: { _id: new ObjectId(), siret: document.siret, created_at: now },
            },
            upsert: true,
          },
        })
      }

      if (operations.length) {
        try {
          await getDbCollection("deca_contrats").bulkWrite(operations, { ordered: false })
          counters.upserted += operations.length
        } catch (err) {
          // en écriture non ordonnée, les opérations qui ont réussi le sont indépendamment des échecs
          const succeeded = err instanceof MongoBulkWriteError ? err.matchedCount + err.upsertedCount : 0
          const failed = operations.length - succeeded
          counters.upserted += succeeded
          counters.errors += failed
          logger.error({ err }, `importDecaContratsParAnnee: échec partiel d'un bulkWrite (${failed}/${operations.length} opérations en échec)`)
        }
      }

      callback()
    },
  })

  try {
    await pipeline(sourceStream, parseStream, groupStreamData<DecaContratsParAnneeDocument>({ size: BULK_WRITE_BATCH_SIZE }), bulkUpsertStream)
  } catch (err) {
    logger.error({ err }, "importDecaContratsParAnnee: échec du pipeline de traitement")
    throw err
  }

  logger.info(`importDecaContratsParAnnee: terminé. total=${counters.total}, upserted=${counters.upserted}, errors=${counters.errors}`)
}
