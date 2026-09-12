import { pipeline } from "node:stream/promises"

import { ObjectId } from "bson"
import type { AggregationCursor, FindCursor } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { limitStream } from "@/common/utils/stream-utils"
import type { IJobPartnerForSearchItem } from "@/services/search/search-items.service"
import {
  applicationCountByJobIdStages,
  applicationCountBySiretLookupStage,
  buildFormationSearchItem,
  buildJobOfferSearchItem,
  buildRecruteurSearchItem,
  formationProjection,
  jobsProjection,
  loadSearchItemBuildContext,
  upsertSearchItem,
} from "@/services/search/search-items.service"

// Génération des mots-clés Mistral : déplacée dans search-items-keywords.service.ts
// (cron continu + batch hebdo recruteurs + ramasse des jobs + import manuel).

const NIGHTLY_CONCURRENCY = 100

/**
 * Consomme un curseur Mongo en flux (mémoire bornée — les sources complètes ne sont jamais
 * chargées en tableau) avec concurrence limitée. Une erreur d'item est capturée (Sentry)
 * SANS interrompre le run ; l'_id fautif est tout de même marqué traité pour ne pas être
 * purgé comme orphelin en fin de batch — le document indexé garde son état précédent.
 */
const processCursorStream = async <T extends { _id: ObjectId }>(
  cursor: FindCursor<T> | AggregationCursor<T>,
  label: string,
  processedIds: Set<string>,
  processItem: (doc: T) => Promise<void>
): Promise<void> => {
  let count = 0
  await pipeline(
    cursor.stream(),
    limitStream<T>({
      concurrency: NIGHTLY_CONCURRENCY,
      processItem: async (doc) => {
        try {
          count++
          if (count % 50_000 === 0) logger.info(`fillSearchItemsCollection: ${label} — ${count} documents traités`)
          await processItem(doc)
        } catch (err) {
          sentryCaptureException(err)
        } finally {
          processedIds.add(doc._id.toString())
        }
      },
    })
  )
  logger.info(`fillSearchItemsCollection: ${label} — ${count} documents traités`)
}

/**
 * Réconciliation complète des sources (formations, offres actives, recruteurs) vers
 * `search_items`. Sert de batch initial ET de réconciliation nightly (cron ~06:00, après
 * processComputedAndImportToJobPartners) : rattrape tout ce que la sync incrémentale
 * (appels explicites + cron delta, cf. searchItems.service.ts) aurait manqué, et purge
 * les documents orphelins (disparus des sources — suppressions physiques comprises).
 */
export const fillSearchItemsCollection = async () => {
  // Récupérer les _id existants : on saute les docs déjà présents et on identifie les suppressions.
  const existingDocs = await getDbCollection("search_items")
    .find({}, { projection: { _id: 1 } })
    .toArray()
  const existingIds = new Set(existingDocs.map((doc) => doc._id.toString()))

  // Curseurs streamés (pas de .toArray() : les sources complètes ne tiennent pas en mémoire).
  const formationsCursor = getDbCollection("formationcatalogues").find({}, { projection: formationProjection })
  const jobsCursor = getDbCollection("jobs_partners").aggregate<IJobPartnerForSearchItem>([
    {
      $match: {
        partner_label: { $ne: JOBPARTNERS_LABEL.RECRUTEURS_LBA },
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      },
    },
    ...applicationCountByJobIdStages,
    {
      $project: {
        ...jobsProjection,
        application_count: 1,
      },
    },
  ])
  const recruteursCursor = getDbCollection("jobs_partners").aggregate<IJobPartnerForSearchItem>([
    {
      $match: {
        partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
        offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      },
    },
    applicationCountBySiretLookupStage,
    {
      $lookup: {
        from: "raw_recruteurslba",
        localField: "workplace_siret",
        foreignField: "siret",
        as: "rawR",
      },
    },
    {
      // rome_codes : priorité au classement de raw_recruteurslba (codes ordonnés par
      // pertinence par l'algo), fallback sur offer_rome_codes de jobs_partners si la
      // collection raw est vide/absente (cas local ou raw purgée) — sinon rome_labels
      // resterait vide pour tous les recruteurs.
      $addFields: {
        rome_codes: {
          $let: {
            vars: {
              fromRaw: {
                $map: {
                  input: {
                    $ifNull: [{ $first: "$rawR.rome_codes" }, []],
                  },
                  as: "rc",
                  in: "$$rc.rome_code",
                },
              },
            },
            in: {
              $slice: [
                {
                  $cond: [{ $gt: [{ $size: "$$fromRaw" }, 0] }, "$$fromRaw", { $ifNull: ["$offer_rome_codes", []] }],
                },
                6,
              ],
            },
          },
        },
        application_count: { $ifNull: [{ $first: "$applications.count" }, 0] },
      },
    },
    {
      // Les intitulés ROME sont résolus côté JS via une Map en mémoire (resolveRomeLabels),
      // partagée avec les offres/formations — plus de $lookup referentielromes par doc.
      $project: {
        ...jobsProjection,
        application_count: 1,
        rome_codes: 1,
      },
    },
  ])

  // Référentiels partagés avec les builders de la sync incrémentale (searchItems.service.ts).
  const ctx = await loadSearchItemBuildContext()

  const processedIds = new Set<string>()
  const searchItemsCollection = getDbCollection("search_items")

  // Un seul chemin par source, item nouveau ou déjà indexé : upsertSearchItem réécrit tous les
  // champs sauf `keywords` (préservés). L'ancienne variante « déjà en base → $set d'une liste
  // fermée de champs » a laissé dériver `address` et `location` : 1 593 offres affichées en prod
  // à une position que la source avait corrigée (2026-09-11). Le coût d'une réécriture complète
  // est le même qu'un $set partiel : un updateOne par item.
  await processCursorStream(formationsCursor, "formations", processedIds, async (formation) => {
    // Sans géopoint, pas d'item de recherche possible : on le compte plutôt que de laisser une
    // exception le dire à Sentry. L'item indexé, s'il existe, garde son état précédent.
    if (!formation.lieu_formation_geopoint) {
      ctx.corrections.formations_sans_geopoint++
      return
    }
    await upsertSearchItem(buildFormationSearchItem(formation, ctx))
  })

  await processCursorStream(jobsCursor, "offres", processedIds, async (job) => {
    await upsertSearchItem(buildJobOfferSearchItem(job, ctx))
  })

  await processCursorStream(recruteursCursor, "recruteurs", processedIds, async (job) => {
    await upsertSearchItem(buildRecruteurSearchItem(job, ctx))
  })

  // Delete documents that are no longer in the sources
  const idsToDelete = [...existingIds].filter((id) => !processedIds.has(id))
  if (idsToDelete.length > 0) {
    await searchItemsCollection.deleteMany({
      _id: { $in: idsToDelete.map((id) => new ObjectId(id)) },
    })
  }

  // Observable en Loki, pas un warn avalé : une correction de données source doit se voir.
  logger.info({ corrections: ctx.corrections }, "fillSearchItemsCollection: corrections appliquées aux données source")

  // Les mots-clés des documents `keywords: null` sont générés par les crons dédiés
  // (generateSearchItemsKeywordsContinuous / submitSearchItemsKeywordsBatch) — cf.
  // searchItemsKeywords.service.ts.
}
