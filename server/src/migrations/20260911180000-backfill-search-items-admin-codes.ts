import { addJob } from "job-processor"

import { logger } from "@/common/logger"
import { createSearchIndexes } from "@/common/utils/mongodb-utils"

/**
 * Filtre exact par département ou région dans la recherche (ban-plateforme#781) : `search_items`
 * porte désormais `departement_code` et `region_code`, indexés en `token` dans Atlas Search.
 *
 * Deux choses doivent suivre le déploiement, sinon une recherche « Bretagne » renvoie zéro
 * résultat en silence (un `equals` sur un champ absent ne matche rien) :
 *  1. la définition de l'index Atlas Search avec les deux nouveaux champs : appliquée ici via
 *     `updateSearchIndex` (idempotent), mongot reconstruit en arrière-plan ;
 *  2. le peuplement des deux champs sur les items existants : `fillSearchItemsCollection`
 *     réécrit chaque item depuis sa source (un `updateOne` par item, jusqu'à 3 h en prod).
 *     Trop long pour une migration synchrone, donc mis en file pour le job processor.
 *
 * Contrôle après coup, dans Compass sur `search_items` :
 *   [{ $listSearchIndexes: {} }]                      → status READY, queryable true
 *   $group par type, $cond sur { $type: "$departement_code" } = "missing" → 0 attendu
 * (pipelines détaillés dans tools/geo-781/compass.md).
 */
export const up = async () => {
  logger.info("search_items : mise à jour de la définition de l'index Atlas Search (departement_code, region_code)")
  await createSearchIndexes()

  logger.info("search_items : mise en file de fillSearchItemsCollection pour peupler departement_code / region_code")
  await addJob({ name: "fillSearchItemsCollection", queued: true, payload: {} })
}
