import { JOB_STATUS_ENGLISH } from "shared"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { isGoogleIndexingConfigured, publishUrlNotification } from "@/common/apis/google-indexing/google-indexing.client"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import config from "@/config"
import { buildLbaUrlFromJob } from "@/services/jobs/job-opportunity/job-opportunity.service"

/**
 * Notification Google Indexing API : pousse à Google en quasi temps réel les URLs d'offres
 * dont l'état public a changé, au lieu d'attendre le crawl du sitemap nocturne. L'API est
 * officiellement réservée aux pages portant du JSON-LD JobPosting — exactement nos pages
 * /emploi (rendu SSR). Même détection des changements réels que pingIndexNow.
 */

// Périmètre restreint aux offres recruteurs LBA tant que le quota Google (200 notifications/jour
// par défaut) n'est pas relevé : ~150 changements/jour sur ce périmètre. Une fois l'augmentation
// de quota accordée, ajouter les autres partner_labels ici (~6 000 changements/jour au total).
const PARTNER_LABELS_SCOPE: string[] = [JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA]

// Fenêtre du delta : 2× l'intervalle du cron (30 min) — un run raté est rattrapé par le
// suivant, les notifications sont idempotentes (même modèle que pingIndexNow).
const DELTA_DEFAULT_WINDOW_MS = 60 * 60 * 1000

/**
 * Cron delta : notifie Google des offres du périmètre créées ou passées en ANNULEE/POURVUE
 * depuis `since` (défaut : 60 min). Toujours en URL_UPDATED : une offre retirée reste servie
 * en 200 avec un contenu modifié (le bouton de candidature disparaît) — URL_DELETED est
 * réservé par Google aux pages réellement supprimées (404/410) et serait contredit au re-crawl.
 *
 * Pas de filtre sur `updated_at` seul (les imports de masse le bumpent sur des documents
 * inchangés — cf. pingIndexNow pour le détail). Tri par `updated_at` décroissant : si le
 * quota s'épuise en cours de run, ce sont les changements les plus récents qui passent.
 * Au premier 429, le run s'arrête : le reliquat est couvert par le sitemap nocturne et,
 * pour les retraits, par le prochain bump d'`updated_at`.
 */
export const pingGoogleIndexing = async (payload?: { since?: Date | string }) => {
  if (!isGoogleIndexingConfigured()) {
    logger.info("pingGoogleIndexing: compte de service non configuré (LBA_GOOGLE_INDEXING_CLIENT_EMAIL / LBA_GOOGLE_INDEXING_PRIVATE_KEY) — no-op")
    return { scanned: 0, published: 0, failed: 0, quotaExhausted: false }
  }

  // `since` peut arriver sérialisé en string (payload CLI / job queued JSON) : sans coercition,
  // `$gte: "2026-…"` (string vs Date BSON) ne matcherait silencieusement aucun document.
  const since = payload?.since ? new Date(payload.since) : new Date(Date.now() - DELTA_DEFAULT_WINDOW_MS)
  if (Number.isNaN(since.getTime())) throw new Error(`pingGoogleIndexing: paramètre since invalide (${payload?.since})`)

  const cursor = getDbCollection("jobs_partners")
    .find(
      {
        partner_label: { $in: PARTNER_LABELS_SCOPE },
        $or: [{ created_at: { $gte: since } }, { offer_status: { $ne: JOB_STATUS_ENGLISH.ACTIVE }, updated_at: { $gte: since } }],
      },
      { projection: { _id: 1, partner_label: 1, workplace_siret: 1, offer_title: 1, workplace_naf_label: 1, updated_at: 1 } }
    )
    .sort({ updated_at: -1 })

  const isDryRun = config.env !== "production"
  const seenUrls = new Set<string>()
  let scanned = 0
  let published = 0
  let failed = 0
  let quotaExhausted = false

  for await (const job of cursor) {
    scanned++
    // URL toujours reconstruite — jamais lue depuis `lba_url`, figé avec le publicUrl de
    // l'environnement qui a exécuté le job d'import (cf. admin/jobs-partners.controller.ts).
    const url = buildLbaUrlFromJob(job)
    if (seenUrls.has(url)) continue
    seenUrls.add(url)

    if (isDryRun) continue

    const result = await publishUrlNotification(url, "URL_UPDATED")
    if (result === "published") {
      published++
    } else if (result === "quota_exhausted") {
      quotaExhausted = true
      break
    } else {
      failed++
    }
  }

  if (isDryRun) {
    logger.info(`pingGoogleIndexing: environnement ${config.env} — dry-run, ${seenUrls.size} URLs détectées, aucune notification`)
  } else {
    logger.info(
      `pingGoogleIndexing: ${scanned} offres du périmètre modifiées depuis ${since.toISOString()} — ${published} notifiées, ${failed} en échec${quotaExhausted ? ", quota quotidien épuisé (run interrompu)" : ""}`
    )
  }
  return { scanned, published, failed, quotaExhausted }
}
