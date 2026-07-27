import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"

import { ObjectId } from "bson"
import { LBA_ITEM_TYPE } from "shared/constants/lbaitem"
import type { ISearchItem } from "shared/models/searchItems.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import type { Message } from "@/services/mistralai/mistralai.service"
import { downloadMistralBatchOutput, getMistralBatchJob, sendMistralMessages, submitMistralBatch } from "@/services/mistralai/mistralai.service"

/**
 * Génération continue des mots-clés Mistral de `search_items`, sans intervention manuelle :
 *
 * - cache `search_items_keywords` keyé par HASH du texte source : les recruteurs partagent
 *   massivement les mêmes rome_labels et les offres re-créées à texte identique ne coûtent
 *   qu'un appel — un drop de `search_items` ne perd plus les keywords ;
 * - offres classiques → API chat immédiate (cron continu, plafonné) ;
 * - recruteurs_lba (rechargés le dimanche, gros volume) → batch Mistral hebdomadaire
 *   dédupliqué par hash (`customId = source_hash`), suivi dans `mistral_batch_jobs` et
 *   ramassé par cron (reprise garantie à travers les redéploiements) ;
 * - import manuel conservé en secours (`applyKeywordsBatchFile`).
 *
 * Convention : `keywords: null` dans search_items = « à générer » ; `[]` = « traité, rien
 * d'utilisable » (réponse invalide/vide) — le document sort de la file, pas de boucle.
 */

export const KEYWORDS_MODEL = "mistral-small-latest"
// 400 : à 200, ~36 % des réponses étaient tronquées en plein JSON (15 mots-clés longs
// ne tiennent pas) → lignes ignorées à l'application du batch.
export const KEYWORDS_MAX_TOKENS = 400
// Taille de tranche par job batch Mistral (mode fichier, jusqu'à 1M req / 512 Mo).
const KEYWORDS_BATCH_CHUNK_SIZE = 50_000
// Le payload envoyé à Mistral est tronqué à 2000 caractères — le hash porte sur le texte
// réellement envoyé (deux textes identiques sur ce préfixe partagent le cache).
const SOURCE_TEXT_MAX_LENGTH = 2000

const KEYWORDS_SYSTEM_PROMPT = `Extrais les mots-clés pertinents d'une offre d'alternance pour un moteur de recherche sémantique.
Règles : uniquement des termes PRÉSENTS dans le texte (n'invente rien) ; compétences techniques/humaines et secteurs d'activité ; 5 à 15 mots-clés ; ignore le HTML.
Réponds STRICTEMENT en JSON : {"keywords": ["mot1", "mot2"]}`

export const buildKeywordsMessages = (text: string): Message[] => [
  { role: "system", content: KEYWORDS_SYSTEM_PROMPT },
  { role: "user", content: text },
]

/** Parse la réponse Mistral `{"keywords": [...]}` en tableau de strings (null si invalide). */
export const parseKeywords = (content: string): string[] | null => {
  try {
    const parsed = JSON.parse(content)
    const keywords = parsed?.keywords
    if (Array.isArray(keywords) && keywords.every((k) => typeof k === "string")) return keywords
    return null
  } catch {
    return null
  }
}

type KeywordsSourceDoc = Pick<ISearchItem, "title" | "description" | "rome_labels"> & { _id: ObjectId; sub_type?: string }

/**
 * Texte source de la génération : titre + description (le titre porte souvent la forme la
 * plus canonique du métier), à défaut les intitulés ROME (recruteurs, description vide —
 * leur title = nom d'entreprise, sans valeur pour les mots-clés). Tronqué à la taille
 * réellement envoyée à Mistral — le hash du cache porte sur ce texte exact.
 */
export const buildKeywordsSourceText = (doc: Pick<ISearchItem, "title" | "description" | "rome_labels">): string => {
  const text = (doc.description?.trim() ? [doc.title?.trim(), doc.description.trim()].filter(Boolean).join("\n") : (doc.rome_labels ?? []).join(", ")).trim()
  return text.substring(0, SOURCE_TEXT_MAX_LENGTH)
}

export const computeSourceHash = (sourceText: string): string => createHash("sha256").update(sourceText).digest("hex")

const now = () => new Date()

/** Écrit/rafraîchit une entrée du cache ([] = traité sans résultat utilisable). */
export const writeKeywordsToCache = async ({ sourceHash, keywords, origin }: { sourceHash: string; keywords: string[]; origin: "immediate" | "batch" | "manual_import" }) => {
  try {
    await getDbCollection("search_items_keywords").updateOne(
      { source_hash: sourceHash },
      { $set: { keywords, model: KEYWORDS_MODEL, origin, last_used_at: now() }, $setOnInsert: { _id: new ObjectId(), created_at: now() } },
      { upsert: true }
    )
  } catch (err) {
    // Course classique de l'upsert Mongo sous index unique : deux écritures concurrentes du
    // même hash → E11000 pour la perdante ; la gagnante a posé un résultat équivalent.
    if ((err as { code?: number })?.code !== 11000) throw err
  }
}

/** Résout un lot de hashes depuis le cache (bump `last_used_at` des entrées servies). */
const resolveKeywordsFromCache = async (hashes: string[]): Promise<Map<string, string[]>> => {
  if (!hashes.length) return new Map()
  const rows = await getDbCollection("search_items_keywords")
    .find({ source_hash: { $in: hashes } }, { projection: { source_hash: 1, keywords: 1 } })
    .toArray()
  if (rows.length) {
    await getDbCollection("search_items_keywords").updateMany({ source_hash: { $in: rows.map((row) => row.source_hash) } }, { $set: { last_used_at: now() } })
  }
  return new Map(rows.map((row) => [row.source_hash, row.keywords]))
}

const PENDING_PROJECTION = { _id: 1, title: 1, description: 1, rome_labels: 1, sub_type: 1 } as const
const CACHE_PASS_CHUNK_SIZE = 500
const CACHE_WRITE_BULK_SIZE = 1_000

/** Applique le cache à un lot de documents ; retourne ceux restés sans réponse (cache miss). */
const applyCacheToDocs = async (docs: KeywordsSourceDoc[]): Promise<{ misses: (KeywordsSourceDoc & { sourceHash: string; sourceText: string })[]; hits: number }> => {
  const withHash: (KeywordsSourceDoc & { sourceHash: string; sourceText: string })[] = []
  for (const doc of docs) {
    const sourceText = buildKeywordsSourceText(doc)
    if (!sourceText) {
      // Sans texte source (doc vide) : rien à générer, on marque [] directement (le doc sort de la file).
      await getDbCollection("search_items").updateOne({ _id: doc._id }, { $set: { keywords: [] } })
      continue
    }
    withHash.push({ ...doc, sourceText, sourceHash: computeSourceHash(sourceText) })
  }

  const cached = await resolveKeywordsFromCache([...new Set(withHash.map((doc) => doc.sourceHash))])

  const misses: (KeywordsSourceDoc & { sourceHash: string; sourceText: string })[] = []
  let hits = 0
  for (const doc of withHash) {
    const keywords = cached.get(doc.sourceHash)
    if (keywords) {
      await getDbCollection("search_items").updateOne({ _id: doc._id }, { $set: { keywords } })
      hits++
    } else {
      misses.push(doc)
    }
  }
  return { misses, hits }
}

const CONTINUOUS_IMMEDIATE_LIMIT = 300
const IMMEDIATE_CONCURRENCY = 5
const MAX_CONSECUTIVE_FAILURES = 5

/**
 * Cron continu (30 min) :
 * 1. passe CACHE sur tous les docs `keywords: null` (recruteurs compris — c'est ainsi que
 *    les résultats des batchs hebdo se propagent vers search_items, gratuitement) ;
 * 2. appels IMMÉDIATS (API chat) pour les offres non-recruteurs restées en miss, plafonnés
 *    par run — les recruteurs en miss attendent le batch hebdomadaire.
 */
export const generateSearchItemsKeywordsContinuous = async (payload?: { limit?: number }) => {
  const limit = Number(payload?.limit ?? CONTINUOUS_IMMEDIATE_LIMIT)
  const counters = { cacheHits: 0, generated: 0, unusable: 0, failures: 0 }

  // 1. Passe cache, par lots, sur l'ensemble de la file. Les candidats immédiats sont
  //    plafonnés À L'ACCUMULATION (pas après coup) : sans cela, un gros backlog (bootstrap)
  //    retiendrait tous les miss en mémoire, descriptions comprises. Dédupliqués par hash :
  //    un seul appel API par texte, les jumeaux seront servis par le cache au tick suivant.
  const pending = getDbCollection("search_items").find({ type: "offre", keywords: null }, { projection: PENDING_PROJECTION })
  const immediateCandidates: (KeywordsSourceDoc & { sourceHash: string; sourceText: string })[] = []
  const candidateHashes = new Set<string>()
  let chunk: KeywordsSourceDoc[] = []
  const flushChunk = async () => {
    if (!chunk.length) return
    const { misses, hits } = await applyCacheToDocs(chunk)
    counters.cacheHits += hits
    for (const doc of misses) {
      if (immediateCandidates.length >= limit) break
      if (doc.sub_type === LBA_ITEM_TYPE.RECRUTEURS_LBA || candidateHashes.has(doc.sourceHash)) continue
      candidateHashes.add(doc.sourceHash)
      immediateCandidates.push(doc)
    }
    chunk = []
  }
  for await (const doc of pending) {
    chunk.push(doc as KeywordsSourceDoc)
    if (chunk.length >= CACHE_PASS_CHUNK_SIZE) await flushChunk()
  }
  await flushChunk()

  // 2. Génération immédiate des offres en miss (plafond par run, concurrence bornée,
  //    abandon après N erreurs API consécutives — retenté au tick suivant). Le compteur
  //    d'échecs est évalué PAR BATCH (résultats agrégés après le Promise.all) : sous
  //    concurrence, un incrément/reset par promesse rendrait le seuil non déterministe.
  let consecutiveFailures = 0

  for (let i = 0; i < immediateCandidates.length; i += IMMEDIATE_CONCURRENCY) {
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      logger.warn(`generateSearchItemsKeywordsContinuous: ${consecutiveFailures} erreurs API consécutives — arrêt du run (reprise au prochain tick)`)
      break
    }
    const outcomes = await Promise.all(
      immediateCandidates.slice(i, i + IMMEDIATE_CONCURRENCY).map(async (doc): Promise<"ok" | "failure"> => {
        const content = await sendMistralMessages({ messages: buildKeywordsMessages(doc.sourceText), model: KEYWORDS_MODEL, maxTokens: KEYWORDS_MAX_TOKENS })
        if (content === null) {
          // Erreur API (réseau, rate limit…) : le doc reste `null`, retenté plus tard.
          counters.failures++
          return "failure"
        }
        const keywords = parseKeywords(content) ?? []
        if (!keywords.length) counters.unusable++
        else counters.generated++
        await writeKeywordsToCache({ sourceHash: doc.sourceHash, keywords, origin: "immediate" })
        await getDbCollection("search_items").updateOne({ _id: doc._id }, { $set: { keywords } })
        return "ok"
      })
    )
    const batchFailures = outcomes.filter((outcome) => outcome === "failure").length
    consecutiveFailures = batchFailures === outcomes.length ? consecutiveFailures + batchFailures : 0
  }

  logger.info(
    `generateSearchItemsKeywordsContinuous: ${counters.cacheHits} depuis le cache, ${counters.generated} générés, ${counters.unusable} sans résultat, ${counters.failures} erreurs API`
  )
  return counters
}

/**
 * Soumission batch Mistral (fire-and-forget, suivi en base) des docs `keywords: null` —
 * recruteurs_lba par défaut (cron hebdo du dimanche soir, après leur rechargement de
 * 10:00 UTC), tous types via CLI (`recruteursOnly: false`) pour un rattrapage massif.
 * Dédupliqué par hash de texte source (`customId = source_hash`) : les combinaisons ROME
 * identiques ne coûtent qu'une requête. Le résultat est ramassé par
 * `applyPendingMistralBatches` puis propagé par la passe cache du cron continu.
 */
export const submitSearchItemsKeywordsBatch = async (payload?: { recruteursOnly?: boolean | string }) => {
  // `recruteursOnly` peut arriver en string via la CLI / un payload de job queued : la string
  // "false" est truthy, d'où la comparaison explicite.
  const recruteursOnly = String(payload?.recruteursOnly ?? true) !== "false"
  const filter = { type: "offre", keywords: null, ...(recruteursOnly ? { sub_type: LBA_ITEM_TYPE.RECRUTEURS_LBA } : {}) }

  // Textes sources dédupliqués par hash.
  const textByHash = new Map<string, string>()
  const cursor = getDbCollection("search_items").find(filter, { projection: PENDING_PROJECTION })
  for await (const doc of cursor) {
    const sourceText = buildKeywordsSourceText(doc as KeywordsSourceDoc)
    if (!sourceText) continue
    textByHash.set(computeSourceHash(sourceText), sourceText)
  }

  // Exclut les hashes déjà en cache (déjà générés — la passe cache du cron continu suffira).
  const hashes = [...textByHash.keys()]
  for (let i = 0; i < hashes.length; i += CACHE_PASS_CHUNK_SIZE) {
    const slice = hashes.slice(i, i + CACHE_PASS_CHUNK_SIZE)
    const cached = await getDbCollection("search_items_keywords")
      .find({ source_hash: { $in: slice } }, { projection: { source_hash: 1 } })
      .toArray()
    for (const row of cached) textByHash.delete(row.source_hash)
  }

  const requests = [...textByHash.entries()].map(([sourceHash, text]) => ({ customId: sourceHash, messages: buildKeywordsMessages(text) }))
  const jobIds: string[] = []
  for (let i = 0; i < requests.length; i += KEYWORDS_BATCH_CHUNK_SIZE) {
    const slice = requests.slice(i, i + KEYWORDS_BATCH_CHUNK_SIZE)
    const jobId = await submitMistralBatch({
      requests: slice,
      model: KEYWORDS_MODEL,
      maxTokens: KEYWORDS_MAX_TOKENS,
      inputFileName: `search_items_keywords_${i / KEYWORDS_BATCH_CHUNK_SIZE + 1}.jsonl`,
    })
    if (!jobId) {
      logger.error(`submitSearchItemsKeywordsBatch: échec de soumission de la tranche ${i / KEYWORDS_BATCH_CHUNK_SIZE + 1} (${slice.length} requêtes)`)
      continue
    }
    jobIds.push(jobId)
    try {
      await getDbCollection("mistral_batch_jobs").insertOne({
        _id: new ObjectId(),
        job_id: jobId,
        kind: "search_items_keywords",
        status: "submitted",
        request_count: slice.length,
        applied_count: null,
        error: null,
        submitted_at: now(),
        checked_at: null,
        applied_at: null,
      })
    } catch (err) {
      // Job soumis (facturé) mais non suivi : la ramasse ne le verra jamais → alerte pour
      // récupération manuelle (`yarn cli search:apply-keywords-batch --file <sortie.jsonl>`).
      sentryCaptureException(err)
      logger.error(`submitSearchItemsKeywordsBatch: job ${jobId} soumis mais suivi non enregistré — sortie à appliquer manuellement`)
    }
  }

  logger.info(`submitSearchItemsKeywordsBatch: ${requests.length} textes uniques (recruteursOnly=${recruteursOnly}), ${jobIds.length} job(s) soumis : ${jobIds.join(", ")}`)
  return { uniqueTexts: requests.length, jobIds }
}

/**
 * Cron de ramasse (horaire) : vérifie les jobs batch `submitted`, télécharge et applique la
 * sortie des jobs terminés dans le CACHE (customId = source_hash) — la propagation vers
 * search_items est assurée par la passe cache du cron continu. Reprise garantie : tout job
 * soumis finit ramassé, même après un redéploiement. Échec → alerte Slack.
 */
export const applyPendingMistralBatches = async () => {
  const pendingJobs = await getDbCollection("mistral_batch_jobs").find({ status: "submitted", kind: "search_items_keywords" }).toArray()
  const counters = { applied: 0, stillRunning: 0, failed: 0 }

  for (const pending of pendingJobs) {
    try {
      const job = await getMistralBatchJob(pending.job_id)

      if (job.status === "SUCCESS" && job.outputFile) {
        const outputs = await downloadMistralBatchOutput(job.outputFile)
        // Écriture au cache par bulkWrite (jusqu'à 50k lignes par job : un updateOne unitaire
        // par ligne = 50k allers-retours). Upserts idempotents → une reprise re-applique sans risque.
        const entries = [...outputs]
        let appliedCount = 0
        for (let i = 0; i < entries.length; i += CACHE_WRITE_BULK_SIZE) {
          const ops = entries.slice(i, i + CACHE_WRITE_BULK_SIZE).map(([sourceHash, content]) => ({
            updateOne: {
              filter: { source_hash: sourceHash },
              update: {
                $set: { keywords: parseKeywords(content) ?? [], model: KEYWORDS_MODEL, origin: "batch" as const, last_used_at: now() },
                $setOnInsert: { _id: new ObjectId(), created_at: now() },
              },
              upsert: true,
            },
          }))
          const result = await getDbCollection("search_items_keywords").bulkWrite(ops, { ordered: false })
          appliedCount += result.upsertedCount + result.matchedCount
        }
        await getDbCollection("mistral_batch_jobs").updateOne(
          { _id: pending._id },
          { $set: { status: "applied", applied_count: appliedCount, applied_at: now(), checked_at: now() } }
        )
        counters.applied++
        logger.info(`applyPendingMistralBatches: job ${pending.job_id} appliqué (${appliedCount}/${pending.request_count} réponses)`)
        continue
      }

      if (["FAILED", "TIMEOUT_EXCEEDED", "CANCELLED"].includes(job.status) || (job.status === "SUCCESS" && !job.outputFile)) {
        await getDbCollection("mistral_batch_jobs").updateOne({ _id: pending._id }, { $set: { status: "failed", error: job.status, checked_at: now() } })
        counters.failed++
        await notifyToSlack({
          subject: "Batch Mistral keywords en échec",
          message: `Le job batch ${pending.job_id} (${pending.request_count} requêtes) est terminé en ${job.status} — les documents concernés seront re-soumis au prochain batch.`,
          error: true,
        })
        continue
      }

      // QUEUED / RUNNING / … : on repassera.
      await getDbCollection("mistral_batch_jobs").updateOne({ _id: pending._id }, { $set: { checked_at: now() } })
      counters.stillRunning++
    } catch (err) {
      sentryCaptureException(err)
    }
  }

  if (pendingJobs.length) {
    logger.info(`applyPendingMistralBatches: ${counters.applied} appliqués, ${counters.stillRunning} en cours, ${counters.failed} en échec (${pendingJobs.length} suivis)`)
  }
  return counters
}

/**
 * Import MANUEL (secours) d'un JSONL de sortie Mistral téléchargé à la main. Deux formats de
 * `custom_id` supportés : hash de texte source (batchs du pipeline actuel) → cache ;
 * ObjectId 24 hex (batchs historiques keyés par document) → search_items + cache.
 */
export const applyKeywordsBatchFile = async (payload?: { file?: string }) => {
  const file = payload?.file
  if (!file) throw new Error("Paramètre --file requis (chemin du JSONL de sortie Mistral)")

  const text = await readFile(file, "utf8")
  let updated = 0
  let skipped = 0

  for (const line of text.split("\n")) {
    if (!line.trim()) continue
    try {
      const parsed = JSON.parse(line)
      const content = parsed?.response?.body?.choices?.[0]?.message?.content
      const keywords = typeof content === "string" ? parseKeywords(content) : null
      const customId: unknown = parsed.custom_id
      if (typeof customId !== "string" || !customId || !keywords || keywords.length === 0) {
        skipped++
        continue
      }

      if (/^[0-9a-f]{24}$/i.test(customId)) {
        // Format historique : custom_id = _id du document search_items.
        const docId = new ObjectId(customId)
        await getDbCollection("search_items").updateOne({ _id: docId }, { $set: { keywords } })
        // Alimente aussi le cache pour les futurs documents au même texte source.
        const doc = await getDbCollection("search_items").findOne({ _id: docId }, { projection: PENDING_PROJECTION })
        const sourceText = doc ? buildKeywordsSourceText(doc) : ""
        if (sourceText) await writeKeywordsToCache({ sourceHash: computeSourceHash(sourceText), keywords, origin: "manual_import" })
      } else {
        // Format courant : custom_id = hash de texte source → cache (propagé par le cron continu).
        await writeKeywordsToCache({ sourceHash: customId, keywords, origin: "manual_import" })
      }
      updated++
    } catch {
      skipped++
    }
  }

  logger.info(`applyKeywordsBatchFile: ${updated} lignes appliquées, ${skipped} ignorées`)
}
