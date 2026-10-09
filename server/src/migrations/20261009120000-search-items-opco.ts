import { addJob } from "job-processor"

import { logger } from "@/common/logger"
import { createSearchIndexes } from "@/common/utils/mongodb-utils"

/**
 * Filtre `opco` / `opcoUrl` de la recherche : les corpus d'offres portent `opco` et `opco_url`,
 * indexés en `token`. Comme pour `departement_code` (cf. 20260911180000-backfill-search-items-admin-codes) :
 * définition des index Atlas Search mise à jour ici, peuplement des items existants mis en file,
 * un `equals` sur un champ absent ne matchant rien d'ici là.
 */
export const up = async () => {
  logger.info("search_jobs / search_jobs_with_training : mise à jour des index Atlas Search (opco, opco_url)")
  await createSearchIndexes()

  logger.info("mise en file de fillSearchItemsCollection pour peupler opco / opco_url")
  await addJob({ name: "fillSearchItemsCollection", queued: true, payload: {} })
}
