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
 * 5 min et faire chevaucher deux runs, soit exactement la latence de publication qu'on cherche à
 * réduire. Le cron delta reste le rattrapage.
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

/**
 * Au-delà de ce délai, un `currently_processed_id` est considéré orphelin et ses documents sont
 * réattribués. Sans cette échappatoire, un run tué net (redéploiement swarm en cours de traitement)
 * laisserait ses documents revendiqués pour toujours, donc jamais publiés — le `finally` ci-dessous
 * ne couvre que les arrêts propres. Le seuil est très au-dessus des durées observées (30 s en
 * régime normal, ~4 min pendant les imports nocturnes) pour ne jamais voler les documents d'un run
 * légitimement lent.
 */
const STALE_PROCESS_ID_AFTER_MS = 60 * 60 * 1000

export const processJobPartnersForApi = async () => {
  logger.info("début de processJobPartnersForApi")
  const processId: string = new ObjectId().toString()
  const last2Days = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

  // Ne revendiquer que les documents libres, comme processMissingRomeAndImportToJobPartners : ce
  // job n'est pas réentrant, et sans ce filtre un run concurrent réattribue les documents du run en
  // cours, dont l'import ne matche alors plus rien et se perd sans erreur.
  // Les 4 premiers octets d'un ObjectId encodent sa date de création et l'hexadécimal se compare
  // dans le même ordre : un `$lt` sur la chaîne suffit à détecter un processId périmé.
  const staleProcessIdBefore = ObjectId.createFromTime(Math.floor((Date.now() - STALE_PROCESS_ID_AFTER_MS) / 1000)).toString()
  await getDbCollection("computed_jobs_partners").updateMany(
    {
      partner_label: { $nin: excludedJobPartnersFromApi },
      updated_at: { $gte: last2Days },
      $or: [{ currently_processed_id: null }, { currently_processed_id: { $lt: staleProcessIdBefore } }],
    },
    { $set: { currently_processed_id: processId, errors: [] } }
  )

  const filter = { currently_processed_id: processId }
  let importedIds: ObjectId[] = []
  try {
    await fillComputedJobsPartners({ addedMatchFilter: filter })
    await importFromComputedToJobsPartners(filter, (ids) => {
      importedIds = ids
    })
    await fillLbaUrl()
    await getDbCollection("computed_jobs_partners").deleteMany({ $and: [filter, { validated: true }] })
  } finally {
    // Libération dans un finally, comme le job voisin : sur échec, laisser les documents
    // revendiqués les rendrait invisibles au run suivant pendant une heure.
    await getDbCollection("computed_jobs_partners").updateMany(filter, { $set: { currently_processed_id: null } })
  }
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
