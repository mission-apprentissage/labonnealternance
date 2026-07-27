/**
 * Grille de critères de sélection des recherches utilisateurs → suggestions / synonymes.
 * Fonctions PURES (aucun accès Mongo/Mistral) : testables unitairement sur fixtures.
 * Les seuils sont regroupés dans CRITERIA — ajustables après quelques runs (le rapport
 * Slack de analyzeSearchQueries donne la distribution des motifs de rejet).
 */

export const CRITERIA = {
  /** Fenêtre d'agrégation (jours). */
  WINDOW_DAYS: 30,

  // ── Candidat → suggestion (autocomplete) ────────────────────────────────
  /** S1 — fréquence minimale sur la fenêtre (sous ce seuil : bruit individuel). */
  SUGGESTION_MIN_TOTAL: 20,
  /** S2 — jours distincts minimum (élimine les rafales bot/mono-session). */
  SUGGESTION_MIN_DAYS_SEEN: 5,
  /** S3 — une suggestion doit mener à des résultats (médiane, robuste aux variantes géo à 0). */
  SUGGESTION_MIN_MEDIAN_HITS: 5,
  /** S4 — au-delà : gap de contenu → route synonyme, jamais suggestion. */
  SUGGESTION_MAX_ZERO_HITS_RATE: 0.3,
  /** S5 — le candidat idéal est une requête que l'autocomplete ne proposait PAS. */
  SUGGESTION_MIN_FREE_TEXT_RATE: 0.6,
  /** S6 — forme : longueur et nombre de tokens. Max 80 : couvre le p95 des intitulés ROME
   * réels (71 car., max 103) qu'un utilisateur peut retaper à la main, tout en coupant les
   * collages de titres d'offres complets (typiquement 90-150 car. avec H/F, ville…). */
  SUGGESTION_MIN_LENGTH: 3,
  SUGGESTION_MAX_LENGTH: 80,
  SUGGESTION_MAX_TOKENS: 6,
  /** S6 — part minimale de caractères "texte" (lettres/espaces/tirets/apostrophes). */
  SUGGESTION_MIN_LETTER_RATE: 0.8,
  /** S12 — confiance IA minimale. */
  SUGGESTION_MIN_CONFIDENCE: 0.8,
  /** Garde-fou : insertions max par run (tri par fréquence décroissante au-delà). */
  MAX_SUGGESTIONS_PER_RUN: 30,

  // ── Candidat → synonyme (impacte le matching global → plus strict) ──────
  /** Y1 — fréquence minimale. */
  SYNONYM_MIN_TOTAL: 30,
  /** Y2 — le synonyme répare un gap de vocabulaire : fort zero-hits OU quasi aucun résultat. */
  SYNONYM_MIN_ZERO_HITS_RATE: 0.5,
  SYNONYM_MAX_MEDIAN_HITS: 2,
  /** Y3 — confiance IA minimale (un faux synonyme dégrade toute la recherche). */
  SYNONYM_MIN_CONFIDENCE: 0.9,
  /** Y6 — groupes max par run. */
  MAX_SYNONYM_GROUPS_PER_RUN: 10,
} as const

/**
 * Liste de blocage éditoriale (comparée sur la forme normalisée) : termes sensibles ou hors
 * périmètre à ne jamais suggérer, quelle que soit leur fréquence. À enrichir avec le produit.
 */
export const SUGGESTION_BLOCKLIST: ReadonlySet<string> = new Set([
  // exemples de départ (saisies parasites fréquentes) — liste à compléter par le produit
  "test",
  "azerty",
  "qwerty",
  "asdf",
])

/** Statistiques agrégées d'une requête normalisée sur la fenêtre d'analyse. */
export type IQueryStats = {
  q_normalized: string
  /** Forme brute la plus fréquente (celle envoyée à l'IA et affichée en cas d'insertion). */
  top_raw_q: string
  total: number
  days_seen: number
  zero_hits_count: number
  free_text_count: number
  median_nb_hits: number
}

/** Résultat de la classification Mistral d'un candidat (validé par Zod dans le job). */
export type IQueryAnalysis = {
  is_relevant: boolean
  category: "metier" | "formation" | "secteur" | "competence" | "entreprise" | null
  contains_pii: boolean
  is_toxic: boolean
  canonical: string | null
  language: "fr" | "en" | "other"
  synonym_of: string | null
  confidence: number
}

export type IVerdict = { verdict: "pass" | "reject"; reason: string | null }

const LETTER_LIKE = /[\p{L}\s'’-]/u

/**
 * Pré-filtre quantitatif COMMUN (S1, S2, S6, S8) : décide si le candidat mérite un appel IA.
 * Les critères spécifiques suggestion vs synonyme (S3-S5 / Y1-Y2) sont évalués ensuite —
 * un candidat à fort zero-hits échoue en suggestion mais reste candidat synonyme.
 */
export function passesQuantitativeGate(stats: IQueryStats): IVerdict {
  if (stats.total < Math.min(CRITERIA.SUGGESTION_MIN_TOTAL, CRITERIA.SYNONYM_MIN_TOTAL)) return { verdict: "reject", reason: "below_min_total" }
  if (stats.days_seen < CRITERIA.SUGGESTION_MIN_DAYS_SEEN) return { verdict: "reject", reason: "below_min_days_seen" }

  const q = stats.top_raw_q.trim()
  if (q.length < CRITERIA.SUGGESTION_MIN_LENGTH || q.length > CRITERIA.SUGGESTION_MAX_LENGTH) return { verdict: "reject", reason: "bad_length" }
  const tokenCount = stats.q_normalized.split(" ").filter(Boolean).length
  if (tokenCount < 1 || tokenCount > CRITERIA.SUGGESTION_MAX_TOKENS) return { verdict: "reject", reason: "bad_token_count" }
  const letterRate = [...q].filter((c) => LETTER_LIKE.test(c)).length / q.length
  if (letterRate < CRITERIA.SUGGESTION_MIN_LETTER_RATE) return { verdict: "reject", reason: "bad_letter_rate" }

  if (SUGGESTION_BLOCKLIST.has(stats.q_normalized)) return { verdict: "reject", reason: "blocklist" }

  return { verdict: "pass", reason: null }
}

/** Volet quantitatif spécifique suggestion (S1, S3, S4, S5) — évalué avant l'IA pour router le candidat. */
export function isSuggestionCandidate(stats: IQueryStats): boolean {
  return (
    stats.total >= CRITERIA.SUGGESTION_MIN_TOTAL &&
    stats.median_nb_hits >= CRITERIA.SUGGESTION_MIN_MEDIAN_HITS &&
    stats.zero_hits_count / stats.total <= CRITERIA.SUGGESTION_MAX_ZERO_HITS_RATE &&
    stats.free_text_count / stats.total >= CRITERIA.SUGGESTION_MIN_FREE_TEXT_RATE
  )
}

/** Volet quantitatif spécifique synonyme (Y1, Y2). */
export function isSynonymCandidate(stats: IQueryStats): boolean {
  return (
    stats.total >= CRITERIA.SYNONYM_MIN_TOTAL &&
    (stats.zero_hits_count / stats.total >= CRITERIA.SYNONYM_MIN_ZERO_HITS_RATE || stats.median_nb_hits <= CRITERIA.SYNONYM_MAX_MEDIAN_HITS)
  )
}

/** Décision finale suggestion (S9-S13) après classification IA. */
export function decideSuggestion(stats: IQueryStats, analysis: IQueryAnalysis): IVerdict {
  if (!isSuggestionCandidate(stats)) return { verdict: "reject", reason: "not_suggestion_candidate" }
  if (analysis.contains_pii) return { verdict: "reject", reason: "pii" }
  if (analysis.is_toxic) return { verdict: "reject", reason: "toxic" }
  if (!analysis.is_relevant || !analysis.category) return { verdict: "reject", reason: "off_topic" }
  if (analysis.confidence < CRITERIA.SUGGESTION_MIN_CONFIDENCE) return { verdict: "reject", reason: "low_confidence" }
  if (!analysis.canonical?.trim()) return { verdict: "reject", reason: "no_canonical" }
  return { verdict: "pass", reason: null }
}

/** Décision finale synonyme (Y3) après classification IA — Y4 (vérification empirique nbHits) et Y5 (non-redondance) sont vérifiés dans le job (accès Mongo). */
export function decideSynonym(stats: IQueryStats, analysis: IQueryAnalysis): IVerdict {
  if (!isSynonymCandidate(stats)) return { verdict: "reject", reason: "not_synonym_candidate" }
  if (analysis.contains_pii) return { verdict: "reject", reason: "pii" }
  if (analysis.is_toxic) return { verdict: "reject", reason: "toxic" }
  if (!analysis.synonym_of?.trim()) return { verdict: "reject", reason: "no_synonym_target" }
  if (analysis.confidence < CRITERIA.SYNONYM_MIN_CONFIDENCE) return { verdict: "reject", reason: "low_confidence" }
  return { verdict: "pass", reason: null }
}
