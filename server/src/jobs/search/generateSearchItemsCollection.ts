import { pipeline } from "node:stream/promises"

import { ObjectId } from "bson"
import type { AggregationCursor, FindCursor } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { limitStream } from "@/common/utils/streamUtils"
import type { IJobPartnerForSearchItem } from "@/services/search/searchItems.service"
import {
  buildFormationSearchItem,
  buildJobOfferSearchItem,
  buildRecruteurSearchItem,
  dedupeRepeatedTitle,
  formationProjection,
  isFormationIncluded,
  jobsProjection,
  loadSearchItemBuildContext,
  sanitizeContractStart,
  stripHtmlToText,
  upsertSearchItem,
} from "@/services/search/searchItems.service"

// Génération des mots-clés Mistral : déplacée dans searchItemsKeywords.service.ts
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
    {
      $lookup: {
        from: "applications",
        let: { jobIdStr: { $toString: "$_id" } },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$job_id", "$$jobIdStr"] },
            },
          },
        ],
        as: "applications",
      },
    },
    {
      $addFields: {
        application_count: { $size: "$applications" },
      },
    },
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
      },
    },
    {
      $lookup: {
        from: "applications",
        localField: "workplace_siret",
        foreignField: "company_siret",
        as: "applications",
      },
    },
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
        application_count: {
          $size: "$applications",
        },
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

  await processCursorStream(formationsCursor, "formations", processedIds, async (formation) => {
    // Déjà en base → on conserve le doc (keywords compris), on resynchronise seulement les
    // champs contrat (backfill des ajouts de schéma sans régénérer la collection).
    if (existingIds.has(formation._id.toString())) {
      await searchItemsCollection.updateOne(
        { _id: formation._id },
        {
          $set: {
            is_disabled_elligible: null,
            start_date: null,
            start_type: null,
            is_start_flexible: null,
            is_algo_company: false,
            is_formation_included: null,
            title: dedupeRepeatedTitle(formation.intitule_rco || ""),
            description: stripHtmlToText(formation.contenu),
          },
        }
      )
      return
    }

    // upsertSearchItem (pas replaceOne) : préserve les keywords d'un doc inséré par la sync
    // incrémentale APRÈS le snapshot existingIds (le nightly dure jusqu'à 3 h en parallèle
    // du cron delta et du cron keywords).
    await upsertSearchItem(buildFormationSearchItem(formation, ctx))
  })

  await processCursorStream(jobsCursor, "offres", processedIds, async (job) => {
    // Déjà en base → on conserve le doc (keywords compris), on resynchronise seulement les
    // champs contrat (backfill des ajouts de schéma sans régénérer la collection).
    if (existingIds.has(job._id.toString())) {
      await searchItemsCollection.updateOne(
        { _id: job._id },
        {
          $set: {
            is_disabled_elligible: job.contract_is_disabled_elligible ?? false,
            start_date: sanitizeContractStart(job.contract_start),
            start_type: job.contract_start_type ?? null,
            is_start_flexible: job.contract_start_is_flexible ?? null,
            is_algo_company: false,
            is_formation_included: isFormationIncluded(job),
            title: dedupeRepeatedTitle(job.offer_title || ""),
            description: stripHtmlToText(job.offer_description),
            // application_count sert au tri (search.service) et rien ne bumpe updated_at à
            // chaque candidature : le nightly est la voie de rafraîchissement de ce compteur
            // (déjà calculé par le $lookup du pipeline — gratuit).
            application_count: job.application_count,
            smart_apply: job.apply_email ? true : false,
          },
        }
      )
      return
    }

    await upsertSearchItem(buildJobOfferSearchItem(job, ctx))
  })

  await processCursorStream(recruteursCursor, "recruteurs", processedIds, async (job) => {
    // Déjà en base → on conserve le doc (keywords compris), on resynchronise seulement les
    // champs contrat (backfill des ajouts de schéma sans régénérer la collection).
    if (existingIds.has(job._id.toString())) {
      await searchItemsCollection.updateOne(
        { _id: job._id },
        {
          $set: {
            is_disabled_elligible: job.contract_is_disabled_elligible ?? false,
            start_date: null,
            start_type: null,
            is_start_flexible: null,
            is_algo_company: true,
            is_formation_included: false,
            application_count: job.application_count,
            smart_apply: job.apply_email ? true : false,
          },
        }
      )
      return
    }

    await upsertSearchItem(buildRecruteurSearchItem(job, ctx))
  })

  // Delete documents that are no longer in the sources
  const idsToDelete = [...existingIds].filter((id) => !processedIds.has(id))
  if (idsToDelete.length > 0) {
    await searchItemsCollection.deleteMany({
      _id: { $in: idsToDelete.map((id) => new ObjectId(id)) },
    })
  }

  // Les mots-clés des documents `keywords: null` sont générés par les crons dédiés
  // (generateSearchItemsKeywordsContinuous / submitSearchItemsKeywordsBatch) — cf.
  // searchItemsKeywords.service.ts.
}
