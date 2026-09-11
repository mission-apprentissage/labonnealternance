import type { ObjectId } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { syncJobPartnersToSearchItemsInChunks } from "@/services/search/search-items.service"

/**
 * Les offres déléguées (déposées par un CFA pour le compte d'une entreprise d'accueil) étaient
 * indexées dans `search_items` sous la raison sociale et l'adresse de l'entreprise : la carte de
 * résultat affichait donc un employeur qui ne doit pas apparaître (issue #5343).
 * `buildJobOfferSearchItem` retient désormais `cfa_legal_name` et `cfa_address_label`.
 *
 * Les offres modifiées après le déploiement sont rattrapées par le cron delta, mais une offre
 * active dont le document source ne bouge plus resterait indexée sous l'ancien nom (la
 * réconciliation nightly ne réécrit ni `organization_name` ni `address` sur un document déjà
 * indexé) → on force ici une resynchronisation de toutes les offres déléguées actives, via le
 * chemin de sync de production (keywords Mistral préservés, index Atlas Search resynchronisé
 * automatiquement).
 *
 * Seules les offres `offres_emploi_lba` peuvent être déléguées : `is_delegated: true` n'est écrit
 * que par `formulaire.service`, sur ce seul `partner_label`. Le filtre `offer_status` +
 * `partner_label` sert l'index `{ offer_status, partner_label, … }` et évite un scan complet.
 */

// Curseur streamé et flush par tranches (même pattern que les autres migrations search_items) :
// la liste des offres déléguées n'est jamais matérialisée en entier. Aligné sur DELTA_CHUNK_SIZE,
// pour que chaque flush corresponde à un chunk de la sync.
const BATCH_SIZE = 500

export const up = async () => {
  const cursor = getDbCollection("jobs_partners").find(
    { offer_status: JOB_STATUS_ENGLISH.ACTIVE, partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, is_delegated: true },
    { projection: { _id: 1 } }
  )

  let scanned = 0
  let upserted = 0
  let removed = 0
  let batch: ObjectId[] = []

  const flushBatch = async () => {
    if (!batch.length) return
    const result = await syncJobPartnersToSearchItemsInChunks(batch)
    upserted += result.upserted
    removed += result.removed
    batch = []
  }

  for await (const doc of cursor) {
    scanned++
    batch.push(doc._id)
    if (batch.length >= BATCH_SIZE) await flushBatch()
  }
  await flushBatch()

  logger.info(`reindex-delegated-offers-cfa-name: ${scanned} offres déléguées actives, ${upserted} réindexées, ${removed} retirées de l'index`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
