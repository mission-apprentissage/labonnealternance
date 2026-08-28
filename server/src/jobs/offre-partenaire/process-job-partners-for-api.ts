import type { Filter } from "mongodb"
import { ObjectId } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { syncJobPartnersToSearchItemsInChunks } from "@/services/search/search-items.service"
import { fillComputedJobsPartners } from "./fill-computed-jobs-partners"
import { fillLbaUrl } from "./fill-lba-url"
import { importFromComputedToJobsPartners } from "./import-from-computed-to-jobs-partners"

const excludedJobPartnersFromApi = Object.values(JOBPARTNERS_LABEL)

/**
 * Indexe dans search_items les offres que le run vient d'écrire dans jobs_partners, sans attendre
 * le cron delta : les deux crons n'ont aucun rendez-vous, et lancés sur la même minute le delta lit
 * jobs_partners AVANT le commit de l'import (observé en recette le 28/08/2026 : import terminé à
 * 10:00:49, delta démarré à 10:00:23 → « 0 modifiés », offre visible seulement à 10:15).
 *
 * Indexation ciblée sur les _id importés, et non sur une fenêtre `updated_at` : une fenêtre
 * absorberait tout ce qu'un AUTRE job écrit pendant ce run, donc jusqu'à 4 min de travail mesurées
 * pendant les imports de masse nocturnes — de quoi allonger ce cron au-delà de son intervalle de
 * 5 min et faire skipper des runs (concurrency exclusive), soit exactement la latence de
 * publication qu'on cherche à réduire. Le cron delta reste le rattrapage.
 *
 * L'indexation ne doit pas faire échouer le run : l'import est déjà commité en base, et une erreur
 * ici serait rejouée par le cron delta puis par la réconciliation nightly.
 */
const syncImportedJobsToSearchItems = async (jobPartnerIds: ObjectId[]) => {
  // La plupart des runs n'importent rien : pas de ligne de log toutes les 5 min pour 0 offre.
  if (!jobPartnerIds.length) {
    return
  }
  try {
    const { upserted, removed } = await syncJobPartnersToSearchItemsInChunks(jobPartnerIds)
    logger.info(`processJobPartnersForApi: indexation search_items de ${jobPartnerIds.length} offres importées — ${upserted} upserts, ${removed} retraits`)
  } catch (err) {
    // Loggué en plus de Sentry : le run sort en succès, donc sans cette ligne la dégradation est
    // indiscernable d'un bon run dans les logs — or c'est là qu'on diagnostique la latence
    // d'indexation. Les offres restent rattrapées par le cron delta puis par le nightly.
    logger.error({ err, count: jobPartnerIds.length }, "processJobPartnersForApi: indexation search_items en échec, rattrapage laissé au cron delta")
    sentryCaptureException(err)
  }
}

export const processJobPartnersForApi = async () => {
  logger.info("début de processJobPartnersForApi")
  const processId: string = new ObjectId().toString()
  const last2Days = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  await getDbCollection("computed_jobs_partners").updateMany(
    { partner_label: { $nin: excludedJobPartnersFromApi }, updated_at: { $gte: last2Days } },
    { $set: { currently_processed_id: processId, errors: [] } }
  )

  const filter = { currently_processed_id: processId }

  let importedIds: ObjectId[] = []
  await fillComputedJobsPartners({ addedMatchFilter: filter, skipCfaAndClassificationDetection: true })
  await importFromComputedToJobsPartners(filter, (ids) => {
    importedIds = ids
  })
  await fillLbaUrl()
  await getDbCollection("computed_jobs_partners").deleteMany({ $and: [filter, { validated: true }] })
  await getDbCollection("computed_jobs_partners").updateMany(filter, { $set: { currently_processed_id: null } })
  await syncImportedJobsToSearchItems(importedIds)
  logger.info("fin de processJobPartnersForApi")
}

export const processJobPartnersWithFilter = async (filter: Filter<IComputedJobsPartners>) => {
  logger.info({ filter }, "début de processJobPartnersWithFilter")
  let importedIds: ObjectId[] = []
  await fillComputedJobsPartners({ addedMatchFilter: filter })
  await importFromComputedToJobsPartners(filter, (ids) => {
    importedIds = ids
  })
  await fillLbaUrl()
  await getDbCollection("computed_jobs_partners").deleteMany({ $and: [filter, { validated: true }] })
  await syncImportedJobsToSearchItems(importedIds)
  logger.info({ filter }, "fin de processJobPartnersWithFilter")
}
