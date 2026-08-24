import { createInterface } from "node:readline"
import type { Readable } from "node:stream"

import type { AnyBulkWriteOperation } from "mongodb"
import { ObjectId } from "mongodb"
import { extensions } from "shared/helpers/zod-helpers/zod-primitives"
import type { IReferentielEngagementEntreprise } from "shared/models/referentiel-engagement-entreprise.model"
import { EntrepriseEngagementSources } from "shared/models/referentiel-engagement-entreprise.model"
import { z } from "zod"

import { logger } from "@/common/logger"
import { s3ReadAsStream } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { refreshEntrepriseEngagementJobsPartners } from "@/jobs/engagement-handicap/refresh-entreprise-engagement-jobs-partners"

const S3_KEY = "siretlist/lba_handi_engage_flag.ndjson"

// Nombre d'opérations upsert accumulées avant l'envoi d'un bulkWrite : borne la mémoire et le nombre
// d'aller-retours MongoDB tout en conservant des lots de taille raisonnable.
const BULK_WRITE_BATCH_SIZE = 500

// Marge acceptée entre le nombre de SIRET du fichier téléchargé et le nombre de documents
// FRANCE_TRAVAIL déjà en base, avant d'autoriser le nettoyage des sources obsolètes.
const MISSING_SIRETS_CLEANUP_MARGIN_RATIO = 0.2

// Le fichier ndjson est supposé contenir une entrée `{ siret: string, ... }` par ligne.
// Hypothèse à vérifier sur un échantillon réel du fichier : nom du champ = "siret" (lowercase).
// `extensions.siret` contrôle à la fois le format (regex) et la clé de Luhn.
const ZHandiEngageFlagDocument = z.object({ siret: extensions.siret })

type BulkUpsertOp = AnyBulkWriteOperation<IReferentielEngagementEntreprise>

type BulkUpsertCounters = { upsertedCount: number; modifiedCount: number }

// Un seul cas d'upsert, que le SIRET soit nouveau, déjà à jour ou à compléter avec la source FRANCE_TRAVAIL :
// $addToSet ajoute la source sans doublon et sans écraser d'éventuelles autres sources, $setOnInsert
// n'initialise le document qu'à la création. Un SIRET déjà à jour est donc réécrit (updated_at rafraîchi)
// même quand rien ne change réellement : ce coût est accepté pour éviter un aller-retour findOne par SIRET.
const buildUpsertOp = (siret: string, now: Date): BulkUpsertOp => ({
  updateOne: {
    filter: { siret },
    update: {
      $addToSet: { sources: EntrepriseEngagementSources.FRANCE_TRAVAIL },
      $set: { updated_at: now, engagement: "handicap" },
      $setOnInsert: { _id: new ObjectId(), created_at: now, siret },
    },
    upsert: true,
  },
})

const flushBulkOps = async (ops: BulkUpsertOp[]): Promise<BulkUpsertCounters> => {
  if (ops.length === 0) return { upsertedCount: 0, modifiedCount: 0 }
  const result = await getDbCollection("referentiel_engagement_entreprise").bulkWrite(ops, { ordered: false })
  return { upsertedCount: result.upsertedCount, modifiedCount: result.modifiedCount }
}

// SIRET présents en référentiel avec la source FRANCE_TRAVAIL mais absents du fichier S3 téléchargé :
// - source FRANCE_TRAVAIL seule → l'entrée est supprimée
// - sources LBA + FRANCE_TRAVAIL → la source FRANCE_TRAVAIL est retirée, l'entrée (source LBA) est conservée
// (les entrées avec uniquement la source LBA ne sont pas concernées : elles ne sont jamais retournées par ce filtre)
const removeFranceTravailSourceForMissingSirets = async (sirets: Set<string>) => {
  const staleDocs = await getDbCollection("referentiel_engagement_entreprise").find({ engagement: "handicap", sources: EntrepriseEngagementSources.FRANCE_TRAVAIL }).toArray()

  let removed = 0
  let franceTravailSourceRemoved = 0

  for (const doc of staleDocs) {
    if (sirets.has(doc.siret)) continue

    const remainingSources = doc.sources.filter((source) => source !== EntrepriseEngagementSources.FRANCE_TRAVAIL)
    if (remainingSources.length === 0) {
      await getDbCollection("referentiel_engagement_entreprise").deleteOne({ _id: doc._id })
      removed++
    } else {
      await getDbCollection("referentiel_engagement_entreprise").updateOne({ _id: doc._id }, { $set: { sources: remainingSources, updated_at: new Date() } })
      franceTravailSourceRemoved++
    }
  }

  return { removed, franceTravailSourceRemoved }
}

export const updateHandiEngagement = async () => {
  logger.info(`updateHandiEngagement: téléchargement de ${S3_KEY}`)

  const previousFranceTravailCount = await getDbCollection("referentiel_engagement_entreprise").countDocuments({
    engagement: "handicap",
    sources: EntrepriseEngagementSources.FRANCE_TRAVAIL,
  })

  let stream: Readable | undefined
  try {
    stream = await s3ReadAsStream("storage", S3_KEY)
  } catch (err) {
    logger.error({ err }, `updateHandiEngagement: échec de la lecture du fichier S3 (${S3_KEY})`)
    sentryCaptureException(err)
    throw err
  }

  if (!stream) {
    logger.warn(`updateHandiEngagement: fichier vide ou introuvable (${S3_KEY})`)
    return
  }

  const now = new Date()
  let errors = 0
  const sirets = new Set<string>()
  const counters: BulkUpsertCounters = { upsertedCount: 0, modifiedCount: 0 }
  let pendingOps: BulkUpsertOp[] = []

  const addCounters = (batch: BulkUpsertCounters) => {
    counters.upsertedCount += batch.upsertedCount
    counters.modifiedCount += batch.modifiedCount
  }

  // Lecture ligne à ligne en streaming (pas de chargement du fichier entier en mémoire) et écriture par
  // lots via bulkWrite (pas d'aller-retour MongoDB par SIRET).
  const lines = createInterface({ input: stream, crlfDelay: Infinity })
  for await (const line of lines) {
    if (!line.trim()) continue
    try {
      const { siret } = ZHandiEngageFlagDocument.parse(JSON.parse(line))
      if (sirets.has(siret)) continue
      sirets.add(siret)

      pendingOps.push(buildUpsertOp(siret, now))
      if (pendingOps.length >= BULK_WRITE_BATCH_SIZE) {
        addCounters(await flushBulkOps(pendingOps))
        pendingOps = []
      }
    } catch (err) {
      logger.error({ err, line }, "updateHandiEngagement: ligne ndjson non traitable")
      errors++
    }
  }
  addCounters(await flushBulkOps(pendingOps))

  logger.info(`updateHandiEngagement: ${counters.upsertedCount} créés, ${counters.modifiedCount} mis à jour (source déjà à jour ou complétée), ${errors} erreurs`)

  // Garde-fou : un fichier tronqué ou incomplet pourrait entraîner la suppression de sources France Travail
  // pour des SIRET encore valides. On ne déclenche le nettoyage que si l'écart entre le nombre de SIRET du
  // fichier et le nombre de documents FRANCE_TRAVAIL déjà en base reste dans une marge de ±20%.
  const minExpectedCount = previousFranceTravailCount * (1 - MISSING_SIRETS_CLEANUP_MARGIN_RATIO)
  const maxExpectedCount = previousFranceTravailCount * (1 + MISSING_SIRETS_CLEANUP_MARGIN_RATIO)
  const isWithinMargin = previousFranceTravailCount === 0 || (sirets.size >= minExpectedCount && sirets.size <= maxExpectedCount)

  if (errors === 0 && sirets.size > 0 && isWithinMargin) {
    const { removed, franceTravailSourceRemoved } = await removeFranceTravailSourceForMissingSirets(sirets)
    logger.info(`updateHandiEngagement: ${removed} entrées supprimées, ${franceTravailSourceRemoved} sources France Travail retirées (SIRET absents du fichier)`)
  } else {
    logger.warn(
      `updateHandiEngagement: contrôle inverse ignoré (errors=${errors}, sirets=${sirets.size}, previousFranceTravailCount=${previousFranceTravailCount}, isWithinMargin=${isWithinMargin})`
    )
  }

  logger.info(`updateHandiEngagement: mise à jour des offres dans jobs_partners`)
  await refreshEntrepriseEngagementJobsPartners()
  logger.info(`updateHandiEngagement: mise à jour des offres dans jobs_partners terminée`)
}
