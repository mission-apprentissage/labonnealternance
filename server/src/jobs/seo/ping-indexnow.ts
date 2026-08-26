import { JOB_STATUS_ENGLISH } from "shared"
import { INDEXNOW_KEY } from "shared/constants/indexnow"
import getApiClient from "@/common/apis/client"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import config from "@/config"
import { buildLbaUrlFromJob } from "@/services/jobs/job-opportunity/job-opportunity.service"

/**
 * Notification IndexNow (https://www.indexnow.org/documentation) : signale aux moteurs
 * partenaires (Bing, Yandex, Seznam, Naver — et indirectement ChatGPT/Copilot qui
 * s'appuient sur l'index Bing) les URLs d'offres publiées ou retirées, au lieu d'attendre
 * leur crawl du sitemap nocturne. Un même endpoint sert les ajouts et les retraits : le
 * moteur re-crawle l'URL et constate lui-même le 200 ou le 404.
 */

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"
// Limite du protocole : 10 000 URLs max par soumission.
const INDEXNOW_BATCH_SIZE = 10_000
// Fenêtre du delta : 2× l'intervalle du cron (30 min) — un run raté est rattrapé par le
// suivant, les soumissions sont idempotentes (même modèle que syncSearchItemsDelta).
const DELTA_DEFAULT_WINDOW_MS = 60 * 60 * 1000

const axiosClient = getApiClient({ timeout: 15_000 })

type IndexNowPayload = {
  host: string
  key: string
  keyLocation: string
  urlList: string[]
}

export const buildIndexNowPayloads = (urls: string[], publicUrl: string): IndexNowPayload[] => {
  const host = new URL(publicUrl).host
  const payloads: IndexNowPayload[] = []
  for (let i = 0; i < urls.length; i += INDEXNOW_BATCH_SIZE) {
    payloads.push({
      host,
      key: INDEXNOW_KEY,
      keyLocation: `${publicUrl}/${INDEXNOW_KEY}.txt`,
      urlList: urls.slice(i, i + INDEXNOW_BATCH_SIZE),
    })
  }
  return payloads
}

/**
 * Cron delta : soumet à IndexNow les URLs des offres dont l'état public a réellement changé
 * depuis `since` (défaut : 60 min) — offres nouvellement créées, et passages en
 * ANNULEE/POURVUE (la page devient 404 ; les jobs d'expiration/annulation bumpent
 * `updated_at` en changeant `offer_status`).
 *
 * On ne filtre PAS sur `updated_at` seul : les imports de masse le bumpent sur des documents
 * inchangés (cf. import-from-computed-to-jobs-partners), ce qui re-soumettrait tout le corpus
 * après chaque import — le protocole IndexNow pénalise la soumission répétée d'URLs
 * inchangées (clé throttlée ou ignorée). Les suppressions physiques, invisibles ici, restent
 * couvertes par le crawl classique.
 */
export const pingIndexNow = async (payload?: { since?: Date | string }) => {
  // `since` peut arriver sérialisé en string (payload CLI / job queued JSON) : sans coercition,
  // `$gte: "2026-…"` (string vs Date BSON) ne matcherait silencieusement aucun document.
  const since = payload?.since ? new Date(payload.since) : new Date(Date.now() - DELTA_DEFAULT_WINDOW_MS)
  if (Number.isNaN(since.getTime())) throw new Error(`pingIndexNow: paramètre since invalide (${payload?.since})`)

  const cursor = getDbCollection("jobs_partners").find(
    {
      $or: [{ created_at: { $gte: since } }, { offer_status: { $ne: JOB_STATUS_ENGLISH.ACTIVE }, updated_at: { $gte: since } }],
    },
    { projection: { _id: 1, partner_label: 1, workplace_siret: 1, offer_title: 1, workplace_naf_label: 1 } }
  )

  const isDryRun = config.env !== "production"
  let scanned = 0
  let submitted = 0
  let failed = 0

  const submitBatch = async (urls: string[]) => {
    if (urls.length === 0) return
    if (isDryRun) return
    // Un lot ≤ INDEXNOW_BATCH_SIZE donne toujours exactement un payload.
    for (const batch of buildIndexNowPayloads(urls, config.publicUrl)) {
      try {
        await axiosClient.post(INDEXNOW_ENDPOINT, batch)
        submitted += batch.urlList.length
      } catch (err) {
        // Un lot en échec n'interrompt pas les suivants : les URLs seront re-soumises au
        // prochain changement d'état, et les moteurs re-crawlent le sitemap chaque nuit.
        failed += batch.urlList.length
        sentryCaptureException(err)
      }
    }
  }

  // Curseur + lots bornés : jamais tout le résultat en mémoire (contrairement à un .toArray()
  // qui exploserait après un backfill --since large). Le Set déduplique les URLs recruteurs
  // partageant un même siret au sein d'un lot.
  let batchUrls = new Set<string>()
  for await (const job of cursor) {
    scanned++
    // URL toujours reconstruite — jamais lue depuis `lba_url`, figé avec le publicUrl de
    // l'environnement qui a exécuté le job d'import (cf. admin/jobs-partners.controller.ts).
    batchUrls.add(buildLbaUrlFromJob(job))
    if (batchUrls.size >= INDEXNOW_BATCH_SIZE) {
      await submitBatch([...batchUrls])
      batchUrls = new Set()
    }
  }
  await submitBatch([...batchUrls])

  if (isDryRun) {
    logger.info(`pingIndexNow: environnement ${config.env} — dry-run, ${scanned} offres détectées, aucune soumission`)
  } else {
    logger.info(`pingIndexNow: ${scanned} offres créées ou retirées depuis ${since.toISOString()} — ${submitted} URLs soumises, ${failed} en échec`)
  }
  return { scanned, submitted }
}
