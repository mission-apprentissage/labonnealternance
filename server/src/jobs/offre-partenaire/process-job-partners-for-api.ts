import type { Filter } from "mongodb"
import { ObjectId } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { syncSearchItemsDelta } from "@/services/search/search-items.service"
import { fillComputedJobsPartners } from "./fill-computed-jobs-partners"
import { fillLbaUrl } from "./fill-lba-url"
import { importFromComputedToJobsPartners } from "./import-from-computed-to-jobs-partners"

const excludedJobPartnersFromApi = Object.values(JOBPARTNERS_LABEL)

/**
 * Indexe dans search_items ce que le run vient d'écrire dans jobs_partners, sans attendre le cron
 * delta : les deux crons n'ont aucun rendez-vous, et lancés sur la même minute le delta lit
 * jobs_partners AVANT le commit de l'import (observé en recette le 28/08/2026 : import terminé à
 * 10:00:49, delta démarré à 10:00:23 → « 0 modifiés », offre visible seulement à 10:15).
 *
 * Réutilise syncSearchItemsDelta plutôt que de collecter les _id dans la boucle d'import : la
 * borne `updated_at` désigne exactement les documents écrits par ce run, et on hérite du
 * découpage en chunks et du contexte de build partagé. Le cron delta reste le rattrapage.
 *
 * L'indexation ne doit pas faire échouer le run : l'import est déjà commité en base, et une erreur
 * ici serait rejouée par le cron delta puis par la réconciliation nightly.
 */
const syncImportedJobsToSearchItems = async (since: Date) => {
  try {
    await syncSearchItemsDelta({ since })
  } catch (err) {
    sentryCaptureException(err)
  }
}

export const processJobPartnersForApi = async () => {
  logger.info("début de processJobPartnersForApi")
  const runStartedAt = new Date()
  const processId: string = new ObjectId().toString()
  const last2Days = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  await getDbCollection("computed_jobs_partners").updateMany(
    { partner_label: { $nin: excludedJobPartnersFromApi }, updated_at: { $gte: last2Days } },
    { $set: { currently_processed_id: processId, errors: [] } }
  )

  const filter = { currently_processed_id: processId }
  await fillComputedJobsPartners({ addedMatchFilter: filter })
  await importFromComputedToJobsPartners(filter)
  await fillLbaUrl()
  await getDbCollection("computed_jobs_partners").deleteMany({ $and: [filter, { validated: true }] })
  await getDbCollection("computed_jobs_partners").updateMany(filter, { $set: { currently_processed_id: null } })
  await syncImportedJobsToSearchItems(runStartedAt)
  logger.info("fin de processJobPartnersForApi")
}

export const processJobPartnersWithFilter = async (filter: Filter<IComputedJobsPartners>) => {
  logger.info({ filter }, "début de processJobPartnersWithFilter")
  const runStartedAt = new Date()
  await fillComputedJobsPartners({ addedMatchFilter: filter })
  await importFromComputedToJobsPartners(filter)
  await fillLbaUrl()
  await getDbCollection("computed_jobs_partners").deleteMany({ $and: [filter, { validated: true }] })
  await syncImportedJobsToSearchItems(runStartedAt)
  logger.info({ filter }, "fin de processJobPartnersWithFilter")
}
