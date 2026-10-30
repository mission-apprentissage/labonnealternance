import type { AnyBulkWriteOperation } from "mongodb"
import { ObjectId } from "mongodb"
import { CODE_ROME_REGEX } from "shared/constants/regex"
import type { IReferentielRomeNaf } from "shared/models/referentiel-rome-naf.model"
import { ZReferentielRomeNafContratsParAnnee } from "shared/models/referentiel-rome-naf.model"
import { normalizeNafCode } from "shared/utils/naf-utils"
import { z } from "zod"

import { logger } from "@/common/logger"
import { s3ReadAsString } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"

const S3_KEY = "cross_naf/naf_par_rome.json"
const BULK_WRITE_BATCH_SIZE = 10_000

// Format constaté : un tableau JSON (et non du ndjson), une entrée par couple ROME × NAF, ex.
// { "rome": "A1101", "rome_libelle": "...", "naf": "0161Z", "naf_libelle": "...", "rang": 1, "contrats_par_annee": [{ "annee": 2023, "n_contrats": 276 }] }
// Le NAF est stocké au format de jobs_partners (01.61Z) pour la recherche des offres suggérées.
const ZRomeNafInput = z.object({
  rome: z.string().regex(CODE_ROME_REGEX),
  rome_libelle: z.string().min(1),
  naf: z
    .string()
    .transform(normalizeNafCode)
    .pipe(z.string().regex(/^\d{2}\.\d{2}[A-Z]$/)),
  naf_libelle: z.string().min(1),
  rang: z.number().int().positive(),
  contrats_par_annee: ZReferentielRomeNafContratsParAnnee,
})

type RomeNafInput = z.output<typeof ZRomeNafInput>

const parseRomeNafFile = (content: string | undefined): RomeNafInput[] => {
  const rows: unknown = JSON.parse(content ?? "")
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error(`importReferentielRomeNaf: ${S3_KEY} n'est pas un tableau non vide`)
  }

  const documents: RomeNafInput[] = []
  const pairs = new Set<string>()
  let errors = 0
  for (const [index, row] of rows.entries()) {
    const result = ZRomeNafInput.safeParse(row)
    if (!result.success) {
      errors++
      logger.error({ index, row, issues: result.error.issues }, "importReferentielRomeNaf: ligne invalide")
      continue
    }
    const pair = `${result.data.rome}|${result.data.naf}`
    if (pairs.has(pair)) {
      errors++
      logger.error({ index, row }, "importReferentielRomeNaf: couple ROME × NAF en doublon")
      continue
    }
    pairs.add(pair)
    documents.push(result.data)
  }

  // Le classement des NAF d'un ROME n'a de sens que complet : un fichier en partie invalide n'est pas importé.
  if (errors > 0) {
    throw new Error(`importReferentielRomeNaf: ${errors}/${rows.length} ligne(s) rejetée(s) sur ${S3_KEY}, aucun import`)
  }
  return documents
}

const toUpsertOperation = (document: RomeNafInput, now: Date): AnyBulkWriteOperation<IReferentielRomeNaf> => ({
  updateOne: {
    filter: { rome: document.rome, naf: document.naf },
    update: {
      $set: { ...document, updated_at: now },
      $setOnInsert: { _id: new ObjectId(), created_at: now },
    },
    upsert: true,
  },
})

export const importReferentielRomeNaf = async () => {
  logger.info(`importReferentielRomeNaf: téléchargement de ${S3_KEY}`)
  const documents = parseRomeNafFile(await s3ReadAsString("storage", S3_KEY))

  const now = new Date()
  const counters = { total: documents.length, upserted: 0, modified: 0, deleted: 0 }
  for (let i = 0; i < documents.length; i += BULK_WRITE_BATCH_SIZE) {
    const operations = documents.slice(i, i + BULK_WRITE_BATCH_SIZE).map((document) => toUpsertOperation(document, now))
    const result = await getDbCollection("referentiel_rome_naf").bulkWrite(operations, { ordered: false })
    counters.upserted += result.upsertedCount
    counters.modified += result.modifiedCount
  }

  // Upsert puis purge plutôt que vidage et réimport : la collection reste lisible par l'envoi des suggestions pendant l'import.
  const { deletedCount } = await getDbCollection("referentiel_rome_naf").deleteMany({ updated_at: { $lt: now } })
  counters.deleted = deletedCount

  logger.info(counters, "importReferentielRomeNaf: terminé")
  return counters
}
