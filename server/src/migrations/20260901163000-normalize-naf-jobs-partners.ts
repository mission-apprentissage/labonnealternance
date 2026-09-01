import type { AnyBulkWriteOperation } from "mongodb"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { normalizeNafCode, normalizeNafLabel } from "shared/utils/naf-utils"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * Rattrapage de l'existant pour l'homogénéisation NAF (issue #5344). Le code passe désormais à la
 * notation INSEE (« 46.73A ») et le libellé en casse de phrase quand il arrive uniformément casé,
 * mais seuls les documents réimportés repassent par le pipeline : les offres annulées ou expirées,
 * et les offres LBA dont le SIRET n'est pas re-sollicité, gardent leur forme d'origine.
 *
 * Périmètre volontairement limité à `jobs_partners`, la collection visée par le critère
 * d'acceptation :
 * - `computed_jobs_partners` se régénère seul (`raw-to-computed` fait un deleteMany par
 *   partner_label, et `fillComputedRecruteursLba` remet `jobs_in_success` à vide) ;
 * - `entreprises.naf_code` et `recruiters.naf_code` sont laissés au format de l'API entreprise :
 *   ils sont comparés tels quels à « 78.20Z » côté espace-pro (éligibilité au support France
 *   Travail) ;
 * - `search_items.activity_sector` applique déjà sa propre canonicalisation de casse
 *   (`pickCanonicalVariant`, qui privilégie la casse mixte puis la fréquence — même politique que
 *   `normalizeNafLabel`) et converge donc de lui-même au fil des réimports.
 *
 * `updated_at` n'est PAS touché : le cron « Sync delta search_items » resynchronise les
 * jobs_partners modifiés sur une fenêtre de 10 minutes, et bumper l'horodatage de tout le corpus
 * d'un coup lui ferait avaler la collection entière.
 */

const BATCH_SIZE = 1000

export const up = async () => {
  const collection = getDbCollection("jobs_partners")

  // Filtre volontairement large : le prédicat de `normalizeNafLabel` (libellé uniformément casé,
  // apostrophe typographique, espaces) n'est pas exprimable fidèlement en regex MongoDB, et un
  // filtre qui sous-sélectionne laisserait des lignes non corrigées sans que rien ne le signale.
  // On balaie donc tous les documents portant un NAF et on n'écrit que les valeurs qui changent.
  // `$ne: null` exclut aussi bien le null explicite que le champ absent (mesuré) — et de toute
  // façon la validation de schéma de jobs_partners refuse un document sans ces deux champs.
  const cursor = collection.find(
    { $or: [{ workplace_naf_code: { $ne: null } }, { workplace_naf_label: { $ne: null } }] },
    { projection: { _id: 1, workplace_naf_code: 1, workplace_naf_label: 1 } }
  )

  let scanned = 0
  let updated = 0
  let batch: AnyBulkWriteOperation<IJobsPartnersOfferPrivate>[] = []

  const flushBatch = async () => {
    if (!batch.length) return
    const result = await collection.bulkWrite(batch, { ordered: false })
    updated += result.modifiedCount
    batch = []
  }

  for await (const doc of cursor) {
    scanned++
    const nafCode = normalizeNafCode(doc.workplace_naf_code)
    const nafLabel = normalizeNafLabel(doc.workplace_naf_label)

    const changes: Partial<Pick<IJobsPartnersOfferPrivate, "workplace_naf_code" | "workplace_naf_label">> = {}
    if (nafCode !== doc.workplace_naf_code) changes.workplace_naf_code = nafCode
    if (nafLabel !== doc.workplace_naf_label) changes.workplace_naf_label = nafLabel

    if (Object.keys(changes).length) {
      batch.push({ updateOne: { filter: { _id: doc._id }, update: { $set: changes } } })
    }
    if (batch.length >= BATCH_SIZE) await flushBatch()
  }
  await flushBatch()

  logger.info(`normalize-naf-jobs-partners: ${updated}/${scanned} documents réécrits`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
