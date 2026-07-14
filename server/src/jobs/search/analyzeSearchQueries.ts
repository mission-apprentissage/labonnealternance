import { ObjectId } from "mongodb"
import { z } from "zod"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import type { Message } from "@/services/mistralai/mistralai.service"
import { sendMistralBatch } from "@/services/mistralai/mistralai.service"
import { searchAlgolia, suggestAlgolia } from "@/services/search/search.service"
import { normalizeQuery } from "@/services/search/searchQueryLog.service"

import type { IQueryAnalysis, IQueryStats } from "./searchSuggestionCriteria"
import { CRITERIA, decideSuggestion, decideSynonym, isSuggestionCandidate, isSynonymCandidate, passesQuantitativeGate } from "./searchSuggestionCriteria"

/**
 * Analyse périodique des recherches utilisateurs (`search_queries`, alimentée au fil de l'eau
 * par /v1/search) → enrichissement du moteur de suggestion (`search_suggestions`) et des
 * synonymes de recherche (`search_synonyms`).
 *
 * Pipeline : agrégation 30 j ($group par q_normalized) → pré-filtre déterministe (CRITERIA)
 * → anti-doublon contre l'autocomplete existant → classification Mistral (batch, JSON strict)
 * → décision (suggestion / synonyme / rejet motivé) → insertions cappées → rapport Slack.
 *
 * Garde-fous : caps par run, rejets PERSISTÉS dans search_suggestions (status "rejected") pour
 * ne jamais re-proposer un candidat écarté, run_id sur chaque insertion → rollback groupé via
 * `rollbackSearchSuggestions --runId <id>`.
 */

const ZMistralQueryAnalysis = z.object({
  is_relevant: z.boolean(),
  category: z.enum(["metier", "formation", "secteur", "competence", "entreprise"]).nullable(),
  contains_pii: z.boolean(),
  is_toxic: z.boolean(),
  canonical: z.string().nullable(),
  language: z.enum(["fr", "en", "other"]),
  synonym_of: z.string().nullable(),
  confidence: z.number().min(0).max(1),
})

const ANALYSIS_SYSTEM_PROMPT = `Tu analyses des requêtes tapées par des jeunes sur La bonne alternance, moteur de recherche public d'offres d'alternance et de formations en France.
Pour la requête fournie, réponds UNIQUEMENT avec un objet JSON, sans texte autour :
{
  "is_relevant": bool,       // désigne un métier, une formation, un secteur, une compétence ou une entreprise réels
  "category": "metier" | "formation" | "secteur" | "competence" | "entreprise" | null,
  "contains_pii": bool,      // nom/prénom de personne, email, téléphone, adresse, identifiant
  "is_toxic": bool,          // injure, contenu haineux ou manifestement hors-sujet (test clavier, spam)
  "canonical": string|null,  // forme canonique en français correct : orthographe corrigée, accents rétablis, casse de titre ("bts mco" -> "BTS MCO", "patissier" -> "Pâtissier"). null si is_relevant est false.
  "language": "fr" | "en" | "other",
  "synonym_of": string|null, // si la requête est une abréviation, un sigle ou un terme anglais d'un intitulé français plus courant, donne cet intitulé ("compta" -> "comptabilité", "product manager" -> "chef de produit"). Sinon null.
  "confidence": number       // 0 à 1, confiance globale de ta classification
}
Ne devine jamais : si tu ne reconnais pas le terme, is_relevant=false et confidence basse.`

const buildAnalysisMessages = (stats: IQueryStats): Message[] => [
  { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
  {
    role: "user",
    content: `Requête : "${stats.top_raw_q}"\nStatistiques : ${stats.total} recherches sur ${CRITERIA.WINDOW_DAYS} jours, ${Math.round((stats.zero_hits_count / stats.total) * 100)}% sans résultat, nombre médian de résultats : ${stats.median_nb_hits}.`,
  },
]

/** Agrégation des logs sur la fenêtre : une ligne de stats par requête normalisée. */
async function aggregateQueryStats(): Promise<IQueryStats[]> {
  const since = new Date(Date.now() - CRITERIA.WINDOW_DAYS * 24 * 3600 * 1000)
  return getDbCollection("search_queries")
    .aggregate<IQueryStats>([
      { $match: { created_at: { $gte: since } } },
      {
        $group: {
          _id: "$q_normalized",
          total: { $sum: 1 },
          days: { $addToSet: { $dateTrunc: { date: "$created_at", unit: "day" } } },
          zero_hits_count: { $sum: { $cond: [{ $eq: ["$nb_hits", 0] }, 1, 0] } },
          free_text_count: { $sum: { $cond: [{ $eq: ["$source", "free_text"] }, 1, 0] } },
          median_nb_hits: { $median: { input: "$nb_hits", method: "approximate" } },
          // Forme brute représentative (toutes les variantes partagent la même normalisation ;
          // l'IA reçoit celle-ci et corrige l'orthographe/casse via `canonical`).
          top_raw_q: { $first: "$q" },
        },
      },
      {
        $project: {
          _id: 0,
          q_normalized: "$_id",
          top_raw_q: 1,
          total: 1,
          days_seen: { $size: "$days" },
          zero_hits_count: 1,
          free_text_count: 1,
          median_nb_hits: 1,
        },
      },
    ])
    .toArray()
}

/** Le candidat est-il déjà couvert par l'autocomplete existant (title/rome_labels + suggestions actives) ? */
async function isAlreadySuggested(stats: IQueryStats): Promise<boolean> {
  const { suggestions } = await suggestAlgolia({ q: stats.top_raw_q, limit: 5 })
  return suggestions.some((s) => {
    const normalized = normalizeQuery(s)
    return normalized === stats.q_normalized || normalized.startsWith(`${stats.q_normalized} `) || stats.q_normalized.startsWith(`${normalized} `)
  })
}

export const analyzeSearchQueries = async () => {
  const runId = new ObjectId().toString()
  const now = new Date()

  // 1. Agrégation + pré-filtre déterministe.
  const allStats = await aggregateQueryStats()
  const rejectedReasons = new Map<string, number>()
  const countReason = (reason: string) => rejectedReasons.set(reason, (rejectedReasons.get(reason) ?? 0) + 1)

  const gatePassed: IQueryStats[] = []
  for (const stats of allStats) {
    const gate = passesQuantitativeGate(stats)
    if (gate.verdict === "reject") {
      countReason(gate.reason!)
      continue
    }
    // Doit être candidat à au moins UNE des deux routes pour mériter un appel IA.
    if (!isSuggestionCandidate(stats) && !isSynonymCandidate(stats)) {
      countReason("no_route")
      continue
    }
    gatePassed.push(stats)
  }

  // 2. Exclusion des candidats déjà traités lors de runs précédents (tous statuts).
  const known = await getDbCollection("search_suggestions")
    .find({ normalized: { $in: gatePassed.map((s) => s.q_normalized) } }, { projection: { normalized: 1, status: 1 } })
    .toArray()
  const knownNormalized = new Set(known.map((k) => k.normalized))
  let candidates = gatePassed.filter((s) => !knownNormalized.has(s.q_normalized))
  if (knownNormalized.size > 0) rejectedReasons.set("already_processed", knownNormalized.size)

  // 3. Anti-doublon contre l'autocomplete existant (title/rome_labels) — séquentiel, volumes modestes.
  const notCovered: IQueryStats[] = []
  for (const stats of candidates) {
    if (await isAlreadySuggested(stats)) {
      countReason("already_suggested")
      // Persisté en rejected → pas de re-test au prochain run.
      await persistDecision(stats, null, "rejected", "already_suggested", runId, now)
    } else {
      notCovered.push(stats)
    }
  }
  candidates = notCovered

  if (candidates.length === 0) {
    logger.info(`analyzeSearchQueries[${runId}]: aucun candidat (${allStats.length} requêtes agrégées)`)
    await notifyToSlack({
      subject: "ANALYSE RECHERCHES UTILISATEURS",
      message: `Run ${runId} : aucun nouveau candidat (${allStats.length} requêtes distinctes sur ${CRITERIA.WINDOW_DAYS} j).`,
    })
    return
  }

  // 4. Classification Mistral (batch, JSON strict).
  const contentByCustomId = await sendMistralBatch({
    requests: candidates.map((stats) => ({ customId: stats.q_normalized, messages: buildAnalysisMessages(stats) })),
    model: "mistral-small-latest",
    maxTokens: 256,
  })

  // 5. Décision + insertions cappées.
  const insertedSuggestions: string[] = []
  const insertedSynonyms: string[] = []

  // Tri par fréquence décroissante → en cas de dépassement des caps, les plus recherchés d'abord.
  candidates.sort((a, b) => b.total - a.total)

  for (const stats of candidates) {
    const content = contentByCustomId.get(stats.q_normalized)
    const parsed = content ? safeParseAnalysis(content) : null
    if (!parsed) {
      countReason("ia_invalid")
      await persistDecision(stats, null, "rejected", "ia_invalid", runId, now)
      continue
    }

    // Route suggestion (prioritaire) puis route synonyme.
    const suggestionVerdict = decideSuggestion(stats, parsed)
    if (suggestionVerdict.verdict === "pass" && insertedSuggestions.length < CRITERIA.MAX_SUGGESTIONS_PER_RUN) {
      // S13 : on insère la forme canonique — re-testée contre l'anti-doublon après correction.
      const canonical = parsed.canonical!.trim()
      const canonicalStats = { ...stats, top_raw_q: canonical, q_normalized: normalizeQuery(canonical) || stats.q_normalized }
      if (await isAlreadySuggested(canonicalStats)) {
        countReason("already_suggested")
        await persistDecision(stats, parsed, "rejected", "already_suggested", runId, now)
        continue
      }
      await persistDecision(canonicalStats, parsed, "active", null, runId, now)
      insertedSuggestions.push(canonical)
      continue
    }

    const synonymVerdict = decideSynonym(stats, parsed)
    if (synonymVerdict.verdict === "pass" && insertedSynonyms.length < CRITERIA.MAX_SYNONYM_GROUPS_PER_RUN) {
      const target = parsed.synonym_of!.trim()
      // Y4 — vérification empirique : la forme cible doit réellement produire des résultats.
      const control = await searchAlgolia({ q: target, radius: 30, page: 0, hitsPerPage: 1 })
      if (control.nbHits === 0) {
        countReason("synonym_target_no_hits")
        await persistDecision(stats, parsed, "rejected", "synonym_target_no_hits", runId, now)
        continue
      }
      // Y5 — non-redondance : le couple ne doit exister dans aucun groupe.
      const existing = await getDbCollection("search_synonyms").findOne({ synonyms: { $all: [stats.top_raw_q.toLowerCase(), target.toLowerCase()] } })
      if (existing) {
        countReason("synonym_exists")
        await persistDecision(stats, parsed, "rejected", "synonym_exists", runId, now)
        continue
      }
      await getDbCollection("search_synonyms").insertOne({
        _id: new ObjectId(),
        mappingType: "equivalent",
        synonyms: [stats.top_raw_q.toLowerCase(), target.toLowerCase()],
        origin: "user_queries",
        run_id: runId,
        created_at: now,
      })
      // Trace aussi côté search_suggestions (status disabled : pas dans l'autocomplete, mais audité).
      await persistDecision(stats, parsed, "disabled", "routed_to_synonym", runId, now)
      insertedSynonyms.push(`${stats.top_raw_q} → ${target}`)
      continue
    }

    const reason = suggestionVerdict.reason ?? synonymVerdict.reason ?? "capped"
    countReason(reason)
    await persistDecision(stats, parsed, "rejected", reason, runId, now)
  }

  // 6. Rapport.
  const reasonsSummary = [...rejectedReasons.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `${reason}: ${count}`)
    .join(", ")
  const message = [
    `Run \`${runId}\` — ${allStats.length} requêtes distinctes analysées (fenêtre ${CRITERIA.WINDOW_DAYS} j), ${candidates.length} candidats après pré-filtre.`,
    `Suggestions insérées (${insertedSuggestions.length}) : ${insertedSuggestions.join(", ") || "—"}`,
    `Synonymes insérés (${insertedSynonyms.length}) : ${insertedSynonyms.join(" ; ") || "—"}`,
    `Rejets : ${reasonsSummary || "—"}`,
    `Rollback : \`yarn cli rollbackSearchSuggestions --runId ${runId}\``,
  ].join("\n")
  logger.info(`analyzeSearchQueries[${runId}]:\n${message}`)
  await notifyToSlack({ subject: "ANALYSE RECHERCHES UTILISATEURS", message })
}

function safeParseAnalysis(content: string): IQueryAnalysis | null {
  try {
    const result = ZMistralQueryAnalysis.safeParse(JSON.parse(content))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

async function persistDecision(stats: IQueryStats, analysis: IQueryAnalysis | null, status: "active" | "disabled" | "rejected", reason: string | null, runId: string, now: Date) {
  await getDbCollection("search_suggestions").updateOne(
    { normalized: stats.q_normalized },
    {
      $setOnInsert: { _id: new ObjectId(), normalized: stats.q_normalized, created_at: now },
      $set: {
        term: stats.top_raw_q,
        origin: "user_queries",
        status,
        rejection_reason: reason,
        category: analysis?.category ?? null,
        counters: {
          total_30d: stats.total,
          days_seen_30d: stats.days_seen,
          zero_hits_30d: stats.zero_hits_count,
          free_text_30d: stats.free_text_count,
          median_nb_hits: stats.median_nb_hits,
        },
        confidence: analysis?.confidence ?? null,
        run_id: runId,
        last_seen_at: now,
      },
    },
    { upsert: true }
  )
}

/** Rollback groupé d'un run : supprime les suggestions ET les groupes de synonymes insérés. */
export const rollbackSearchSuggestions = async (payload?: { runId?: string }) => {
  const runId = payload?.runId
  if (!runId) throw new Error("Paramètre --runId requis (cf. rapport Slack du run)")

  const suggestions = await getDbCollection("search_suggestions").deleteMany({ run_id: runId })
  const synonyms = await getDbCollection("search_synonyms").deleteMany({ run_id: runId, origin: "user_queries" })

  const message = `Rollback run \`${runId}\` : ${suggestions.deletedCount} suggestion(s) et ${synonyms.deletedCount} groupe(s) de synonymes supprimés.`
  logger.info(message)
  await notifyToSlack({ subject: "ROLLBACK SUGGESTIONS RECHERCHE", message })
}
