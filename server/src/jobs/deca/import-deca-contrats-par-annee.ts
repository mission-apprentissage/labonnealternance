import { Readable, Transform } from "node:stream"
import { pipeline } from "node:stream/promises"

import type { AnyBulkWriteOperation } from "mongodb"
import { MongoBulkWriteError, ObjectId } from "mongodb"
import type { IDecaContrats } from "shared/models/deca-contrats.model"
import { ZDecaContrats } from "shared/models/deca-contrats.model"
import { validateSIRET } from "shared/validators/siret-validator"
import type { z } from "zod"

import { logger } from "@/common/logger"
import { s3ReadAsStream } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { groupStreamData, ndjsonToObjectStream } from "@/common/utils/stream-utils"

const S3_KEY = "siretlist/lba_deca_contrats_par_annee.ndjson"
const BULK_WRITE_BATCH_SIZE = 10_000

// Format constaté (fichier DECA - Dépôt des Contrats d'Alternance) : une entrée par ligne, ex.
// { "siret": "00552017600016", "contrats_par_annee": { "2023": 2 } }
// _id/created_at/updated_at n'existent pas côté fichier source : on ne valide que les champs qu'il porte
// réellement, avec les mêmes règles (année/valeurs) que le modèle Mongo cible, pas un schéma dupliqué.
const ZDecaContratsInput = ZDecaContrats.pick({ siret: true, contrats_par_annee: true })
type DecaContratsInput = z.infer<typeof ZDecaContratsInput>

export const importDecaContratsParAnnee = async (sourceFileReadStream?: Readable) => {
  logger.info(`importDecaContratsParAnnee: téléchargement de ${S3_KEY}`)

  let sourceStream: Readable
  try {
    // Le runner générique des jobs simples appelle systématiquement fct(job.payload) (jobs.ts), quel que
    // soit le job — job.payload peut donc arriver ici sous forme d'objet quelconque (pas forcément
    // undefined). On ne réutilise ce paramètre que s'il s'agit réellement d'un Readable (cas des tests,
    // qui injectent un stream explicite), sinon on retombe sur la lecture S3 habituelle.
    sourceStream = sourceFileReadStream instanceof Readable ? sourceFileReadStream : await s3ReadAsStream("storage", S3_KEY)
  } catch (err) {
    logger.error({ err }, `importDecaContratsParAnnee: échec de la lecture du fichier S3 (${S3_KEY})`)
    sentryCaptureException(err)
    throw err
  }

  const now = new Date()
  const counters = { total: 0, upserted: 0, errors: 0, jsonErrors: 0 }

  const parseStream = ndjsonToObjectStream((err, line) => {
    // Compté à part de `errors` : une ligne non-JSON n'atteint jamais l'étape par-document (donc jamais
    // `total`), contrairement aux rejets de validation ci-dessous. Sommé dans le message final pour un
    // ratio complet plutôt qu'un total qui sous-compterait ces lignes.
    counters.jsonErrors++
    logger.error({ err, line }, "importDecaContratsParAnnee: ligne ndjson non parsable")
  })

  // Regroupe les documents parsés par lots avant d'écrire, pour limiter le nombre d'aller-retours Mongo
  // sur un fichier de plusieurs centaines de milliers de lignes (cf. import-recruteurs-lba-raw.ts).
  const bulkUpsertStream = new Transform({
    objectMode: true,
    async transform(documents: DecaContratsInput[], _encoding, callback) {
      counters.total += documents.length
      if (counters.total % 20_000 === 0) {
        logger.info(`importDecaContratsParAnnee: ${counters.total} documents traités`)
      }

      const operations: AnyBulkWriteOperation<IDecaContrats>[] = []
      for (const document of documents) {
        const parseResult = ZDecaContratsInput.safeParse(document)
        if (!parseResult.success || !validateSIRET(parseResult.data.siret)) {
          counters.errors++
          logger.error(
            { siret: document?.siret, issues: parseResult.success ? undefined : parseResult.error.issues },
            "importDecaContratsParAnnee: document invalide (siret ou contrats_par_annee), document ignoré"
          )
          continue
        }

        operations.push({
          updateOne: {
            filter: { siret: parseResult.data.siret },
            update: {
              $set: { contrats_par_annee: parseResult.data.contrats_par_annee, updated_at: now },
              $setOnInsert: { _id: new ObjectId(), siret: parseResult.data.siret, created_at: now },
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
          sentryCaptureException(err)
        }
      }

      callback()
    },
  })

  try {
    await pipeline(sourceStream, parseStream, groupStreamData<DecaContratsInput>({ size: BULK_WRITE_BATCH_SIZE }), bulkUpsertStream)
  } catch (err) {
    logger.error({ err }, "importDecaContratsParAnnee: échec du pipeline de traitement")
    sentryCaptureException(err)
    throw err
  }

  logger.info(`importDecaContratsParAnnee: terminé. total=${counters.total}, upserted=${counters.upserted}, errors=${counters.errors}, jsonErrors=${counters.jsonErrors}`)

  // Un mode dégradé (fichier renommé, droits S3 perdus, lignes massivement rejetées) ne doit jamais sortir
  // en succès silencieux : le runner de jobs (jobs.ts) ne regarde que l'absence d'exception pour conclure
  // au succès, indépendamment du contenu des logs.
  if (counters.errors > 0 || counters.jsonErrors > 0) {
    // jsonErrors sommé à total : ces lignes n'ont jamais atteint l'étape par-document (donc jamais compté
    // dans total), sans ce correctif le ratio affiché sous-compterait le nombre réel de lignes du fichier.
    const rejected = counters.errors + counters.jsonErrors
    const total = counters.total + counters.jsonErrors
    const err = new Error(`importDecaContratsParAnnee: ${rejected}/${total} document(s) rejeté(s) sur ${S3_KEY}`)
    sentryCaptureException(err)
    throw err
  }

  return counters
}
