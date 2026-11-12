/**
 * Harnais d'évals du contrôle de légalité (cf #5352). Lancé à la main, jamais en CI : il appelle
 * les API réelles (Mistral, France Travail), il est facturé et non déterministe.
 *
 *   cd server && set -a && source .env && set +a && npx tsx src/services/offre-classification/offre-classification.eval.ts
 *
 * Variables optionnelles, pour mesurer le détecteur 1 sur un autre modèle (serveur local compatible OpenAI) :
 *   EVAL_LLM_BASE_URL (ex. http://127.0.0.1:8080/v1), EVAL_LLM_MODEL, EVAL_LLM_API_KEY,
 *   EVAL_LLM_ONLY=1 (détecteurs 2 et 3 ignorés), EVAL_LIMIT (n premiers cas de chaque jeu), EVAL_CONCURRENCY,
 *   EVAL_OUTPUT (chemin d'un JSON des réponses par cas).
 * Sans elles, le détecteur 1 appelle Mistral avec le modèle de prod.
 *
 * Il mesure les trois détecteurs candidats sur le MÊME jeu, indépendamment, pour répondre à une
 * seule question : combien de détecteurs se justifient ?
 *   1. classifieur LLM (le prototype de ce dossier)
 *   2. API Moderation Mistral (taxonomie sécurité figée)
 *   3. JCMO France Travail (contrôle de légalité, bêta)
 *
 * Métriques : rappel sur les cas à signaler, taux de faux positifs sur les cas conformes. Les deux
 * comptent — un classifieur qui bloque tout a un rappel parfait et ne peut pas partir en production.
 */
import { writeFile } from "node:fs/promises"

import { maskPersonalData } from "@/common/utils/mask-personal-data"

import { ADVERSARIAL_CASES, BENIGN_CASES, EVAL_CASES, type IEvalCase } from "./offre-classification.eval-dataset"
import {
  CLASSIFICATION_MODEL,
  CLASSIFICATION_SYSTEM_PROMPT,
  type IOffreClassificationCategory,
  type IOffreClassificationVerdict,
  parseClassification,
} from "./offre-classification.prompt"

const MISTRAL_KEY = process.env.MISTALAI_API_KEY
const FT_CLIENT_ID = process.env.LBA_ESD_CLIENT_ID
const FT_CLIENT_SECRET = process.env.LBA_ESD_CLIENT_SECRET

const CUSTOM_LLM_BASE_URL = process.env.EVAL_LLM_BASE_URL
const CHAT_BASE_URL = CUSTOM_LLM_BASE_URL ?? "https://api.mistral.ai/v1"
// Modèle de production : une éval sur un alias `-latest` ne dit rien du classifieur déployé.
const CHAT_MODEL = process.env.EVAL_LLM_MODEL ?? CLASSIFICATION_MODEL
const CHAT_KEY = process.env.EVAL_LLM_API_KEY ?? (CUSTOM_LLM_BASE_URL ? "" : MISTRAL_KEY)
const LLM_ONLY = process.env.EVAL_LLM_ONLY === "1"
const LIMIT = process.env.EVAL_LIMIT ? Number(process.env.EVAL_LIMIT) : undefined
const MODERATION_MODEL = "mistral-moderation-latest"
const CONCURRENCY = process.env.EVAL_CONCURRENCY ? Number(process.env.EVAL_CONCURRENCY) : 4

// Sous-échantillon équilibré : les n premiers cas de chaque jeu, pour borner un modèle lent.
const CASES = LIMIT ? [...ADVERSARIAL_CASES.slice(0, LIMIT), ...BENIGN_CASES.slice(0, LIMIT)] : EVAL_CASES

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type IDetectorOutcome = {
  /** Le détecteur a-t-il signalé quelque chose ? */
  flagged: boolean
  /** Verdict, pour le seul détecteur qui en produit un. */
  verdict?: IOffreClassificationVerdict
  categories: string[]
  /** Appel en échec : compté séparément, car la règle de conception le route vers "a_verifier". */
  unavailable: boolean
}

// ---------------------------------------------------------------------------------------------
// Détecteur 1 — classifieur LLM
// ---------------------------------------------------------------------------------------------

type IChatCall = {
  content: string | null
  latencyMs: number
  completionTokens?: number
  /** Débits rapportés par llama-server (`timings`), absents chez Mistral. */
  promptTokensPerSecond?: number
  generatedTokensPerSecond?: number
}

const callChat = async (text: string, attempt = 0): Promise<IChatCall> => {
  const startedAt = performance.now()
  const elapsed = () => performance.now() - startedAt
  let response: Response
  try {
    response = await fetch(`${CHAT_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${CHAT_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: CHAT_MODEL,
        response_format: { type: "json_object" },
        max_tokens: 2048,
        messages: [
          { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        // Réservé au serveur local : l'appel Mistral reste celui de la prod. `cache_prompt` garde le préfixe système en KV cache.
        ...(CUSTOM_LLM_BASE_URL ? { temperature: 0, cache_prompt: true } : {}),
      }),
    })
  } catch (error) {
    console.error(`  chat ${(error as Error).name}`)
    return { content: null, latencyMs: elapsed() }
  }

  if (response.status === 429 && attempt < 3) {
    await sleep([2_000, 10_000, 60_000][attempt])
    return callChat(text, attempt + 1)
  }
  if (!response.ok) {
    console.error(`  chat HTTP ${response.status}`)
    return { content: null, latencyMs: elapsed() }
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
    usage?: { completion_tokens?: number }
    timings?: { prompt_per_second?: number; predicted_per_second?: number }
  }
  return {
    content: payload.choices?.[0]?.message?.content ?? null,
    latencyMs: elapsed(),
    completionTokens: payload.usage?.completion_tokens,
    promptTokensPerSecond: payload.timings?.prompt_per_second,
    generatedTokensPerSecond: payload.timings?.predicted_per_second,
  }
}

const isJson = (raw: string) => {
  try {
    JSON.parse(raw)
    return true
  } catch {
    return false
  }
}

type ILlmOutcome = IDetectorOutcome & { call: IChatCall; invalidJson: boolean }

const runLlmClassifier = async ({ text }: IEvalCase): Promise<ILlmOutcome> => {
  const call = await callChat(maskPersonalData(text))
  const raw = call.content
  if (!raw) return { flagged: false, categories: [], unavailable: true, call, invalidJson: false }

  const classification = parseClassification(raw)
  if (!classification) return { flagged: false, categories: [], unavailable: true, call, invalidJson: !isJson(raw) }

  return {
    flagged: classification.verdict !== "conforme",
    verdict: classification.verdict,
    categories: [...new Set(classification.findings.map(({ category }) => category))],
    unavailable: false,
    call,
    invalidJson: false,
  }
}

const percentile = (values: number[], p: number) => {
  if (values.length === 0) return Number.NaN
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
}

const median = (values: number[]) => percentile(values, 50)

const measureCalls = (outcomes: ILlmOutcome[]) => {
  const latencies = outcomes.map(({ call }) => call.latencyMs / 1000)
  const defined = (values: (number | undefined)[]) => values.filter((value): value is number => value !== undefined)
  return {
    "latence p50 (s)": median(latencies).toFixed(2),
    "latence p95 (s)": percentile(latencies, 95).toFixed(2),
    "latence max (s)": Math.max(...latencies).toFixed(2),
    "JSON invalide": toRate(outcomes.filter(({ invalidJson }) => invalidJson).length, outcomes.length),
    "schéma invalide": toRate(outcomes.filter(({ call, invalidJson, unavailable }) => unavailable && call.content && !invalidJson).length, outcomes.length),
    "tokens générés p50": median(defined(outcomes.map(({ call }) => call.completionTokens))),
    "prefill tok/s p50": median(defined(outcomes.map(({ call }) => call.promptTokensPerSecond))).toFixed(1),
    "génération tok/s p50": median(defined(outcomes.map(({ call }) => call.generatedTokensPerSecond))).toFixed(1),
  }
}

// ---------------------------------------------------------------------------------------------
// Détecteur 2 — API Moderation Mistral
// ---------------------------------------------------------------------------------------------

const runModeration = async (cases: IEvalCase[]): Promise<Map<string, IDetectorOutcome>> => {
  const outcomes = new Map<string, IDetectorOutcome>()

  // L'endpoint accepte un tableau d'entrées : un appel suffit pour tout le jeu.
  const response = await fetch("https://api.mistral.ai/v1/moderations", {
    method: "POST",
    headers: { Authorization: `Bearer ${MISTRAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODERATION_MODEL, input: cases.map(({ text }) => maskPersonalData(text)) }),
  })

  if (!response.ok) {
    console.error(`  moderation HTTP ${response.status}`)
    for (const { id } of cases) outcomes.set(id, { flagged: false, categories: [], unavailable: true })
    return outcomes
  }

  const payload = (await response.json()) as { results?: { categories?: Record<string, boolean> }[] }
  cases.forEach(({ id }, index) => {
    const categories = Object.entries(payload.results?.[index]?.categories ?? {})
      .filter(([, violated]) => violated)
      .map(([category]) => category)
    outcomes.set(id, { flagged: categories.length > 0, categories, unavailable: false })
  })

  return outcomes
}

// ---------------------------------------------------------------------------------------------
// Détecteur 3 — JCMO France Travail
// ---------------------------------------------------------------------------------------------

const getFranceTravailToken = async (): Promise<string | null> => {
  const response = await fetch("https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=partenaire", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: FT_CLIENT_ID ?? "",
      client_secret: FT_CLIENT_SECRET ?? "",
      scope: `application_${FT_CLIENT_ID} api_jecontrolemonoffrev1 legaliteoffreemploi`,
    }),
  })
  if (!response.ok) {
    console.error(`  token FT HTTP ${response.status}`)
    return null
  }
  return ((await response.json()) as { access_token?: string }).access_token ?? null
}

const runJcmo = async ({ champ, text }: IEvalCase, token: string): Promise<IDetectorOutcome> => {
  const response = await fetch("https://api.francetravail.io/partenaire/jecontrolemonoffre/v1/legaliteoffreemploi", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      intitule_offre: "Alternant chargé de mission",
      description_offre: champ === "job_description" ? text : "Missions de gestion administrative et suivi de dossiers.",
      description_entreprise: champ === "job_employer_description" ? text : "Entreprise de services aux collectivités.",
    }),
  })

  // Le verdict est porté par le code HTTP : 200 = alertes, 201 = aucune alerte.
  if (response.status === 201) return { flagged: false, categories: [], unavailable: false }
  if (response.status !== 200) {
    console.error(`  JCMO HTTP ${response.status}`)
    return { flagged: false, categories: [], unavailable: true }
  }

  const payload = (await response.json()) as { alerteDetailList?: { themeAlerte?: string; nomAlerte?: string }[] }
  const alerts = payload.alerteDetailList ?? []
  return {
    flagged: alerts.length > 0,
    categories: [...new Set(alerts.map(({ themeAlerte, nomAlerte }) => `${themeAlerte}/${nomAlerte}`))],
    unavailable: false,
  }
}

// ---------------------------------------------------------------------------------------------
// Exécution et mesures
// ---------------------------------------------------------------------------------------------

const mapWithConcurrency = async <T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> => {
  const results: R[] = []
  for (let i = 0; i < items.length; i += limit) {
    results.push(...(await Promise.all(items.slice(i, i + limit).map(fn))))
    await sleep(300)
  }
  return results
}

type IMetrics = {
  recall: string
  falsePositiveRate: string
  unavailable: number
  exactVerdict?: string
  rightCategory?: string
  /** Faux positifs qui BLOQUENT un contenu conforme : le seul qui empêche un recruteur légitime de publier. */
  fpBloquant?: string
  /** Faux positifs qui partent en revue humaine : coût de file, pas de blocage. */
  fpRevue?: string
  /** Parmi les cas à bloquer, ceux effectivement classés non_conforme (et non seulement escaladés). */
  blocageAttendu?: string
}

const toRate = (numerator: number, denominator: number) => (denominator === 0 ? "n/a" : `${((100 * numerator) / denominator).toFixed(0)} % (${numerator}/${denominator})`)

const measure = (outcomes: Map<string, IDetectorOutcome>, withVerdict: boolean): IMetrics => {
  const toFlag = CASES.filter(({ expected }) => expected !== "conforme")
  const toPass = CASES.filter(({ expected }) => expected === "conforme")

  const flaggedCount = toFlag.filter(({ id }) => outcomes.get(id)?.flagged).length
  const falsePositives = toPass.filter(({ id }) => outcomes.get(id)?.flagged).length
  const metrics: IMetrics = {
    recall: toRate(flaggedCount, toFlag.length),
    falsePositiveRate: toRate(falsePositives, toPass.length),
    unavailable: [...outcomes.values()].filter(({ unavailable }) => unavailable).length,
  }

  if (withVerdict) {
    metrics.exactVerdict = toRate(CASES.filter(({ id, expected }) => outcomes.get(id)?.verdict === expected).length, CASES.length)
    const withRightCategory = toFlag.filter(({ id, categories }) => {
      const outcome = outcomes.get(id)
      if (!outcome?.flagged || !categories) return false
      return outcome.categories.some((category) => categories.includes(category as IOffreClassificationCategory))
    })
    metrics.rightCategory = toRate(withRightCategory.length, toFlag.filter(({ categories }) => categories).length)
    metrics.fpBloquant = toRate(toPass.filter(({ id }) => outcomes.get(id)?.verdict === "non_conforme").length, toPass.length)
    metrics.fpRevue = toRate(toPass.filter(({ id }) => outcomes.get(id)?.verdict === "a_verifier").length, toPass.length)
    const toBlock = CASES.filter(({ expected }) => expected === "non_conforme")
    metrics.blocageAttendu = toRate(toBlock.filter(({ id }) => outcomes.get(id)?.verdict === "non_conforme").length, toBlock.length)
  }

  return metrics
}

const union = (...sources: Map<string, IDetectorOutcome>[]): Map<string, IDetectorOutcome> =>
  new Map(
    CASES.map(({ id }) => [
      id,
      {
        flagged: sources.some((source) => source.get(id)?.flagged),
        categories: sources.flatMap((source) => source.get(id)?.categories ?? []),
        unavailable: sources.some((source) => source.get(id)?.unavailable),
      },
    ])
  )

const main = async () => {
  if (!CHAT_KEY && !CUSTOM_LLM_BASE_URL) throw new Error("MISTALAI_API_KEY manquant")
  if (!MISTRAL_KEY && !LLM_ONLY) throw new Error("MISTALAI_API_KEY manquant (détecteur 2), ou EVAL_LLM_ONLY=1")
  const toFlagCount = CASES.filter(({ expected }) => expected !== "conforme").length
  console.log(`${CASES.length} cas : ${toFlagCount} à signaler, ${CASES.length - toFlagCount} conformes — modèle ${CHAT_MODEL} sur ${CHAT_BASE_URL}\n`)

  console.log("→ détecteur 1 : classifieur LLM")
  const llmResults = await mapWithConcurrency(CASES, CONCURRENCY, async (evalCase) => {
    const outcome = await runLlmClassifier(evalCase)
    console.log(`  ${evalCase.id} ${outcome.verdict ?? "indisponible"} ${(outcome.call.latencyMs / 1000).toFixed(1)} s`)
    return [evalCase.id, outcome] as const
  })
  const llm = new Map<string, ILlmOutcome>(llmResults)

  if (process.env.EVAL_OUTPUT) {
    const dump = CASES.map(({ id, expected }) => ({ id, expected, ...llm.get(id) }))
    await writeFile(process.env.EVAL_OUTPUT, JSON.stringify({ model: CHAT_MODEL, baseUrl: CHAT_BASE_URL, cases: dump }, null, 2))
  }

  const unavailableEverywhere = new Map(CASES.map(({ id }) => [id, { flagged: false, categories: [], unavailable: true }]))
  let moderation: Map<string, IDetectorOutcome> = unavailableEverywhere
  let jcmo: Map<string, IDetectorOutcome> = unavailableEverywhere

  if (!LLM_ONLY) {
    console.log("→ détecteur 2 : API Moderation Mistral")
    moderation = await runModeration(CASES)

    console.log("→ détecteur 3 : JCMO France Travail")
    const token = FT_CLIENT_ID && FT_CLIENT_SECRET ? await getFranceTravailToken() : null
    if (!token) {
      console.log("  identifiants France Travail absents ou refusés : détecteur ignoré")
    } else {
      // 10 appels/seconde autorisés sur la clé : la concurrence de 4 avec pause reste très en dessous.
      const jcmoResults = await mapWithConcurrency(CASES, CONCURRENCY, async (evalCase) => [evalCase.id, await runJcmo(evalCase, token)] as const)
      jcmo = new Map(jcmoResults)
    }
  }

  console.log("\n=== Mesures ===")
  console.table(
    LLM_ONLY
      ? { "1. classifieur LLM": measure(llm, true) }
      : {
          "1. classifieur LLM": measure(llm, true),
          "2. Moderation Mistral": measure(moderation, false),
          "3. JCMO France Travail": measure(jcmo, false),
          "1 ∪ 2": measure(union(llm, moderation), false),
          "1 ∪ 3": measure(union(llm, jcmo), false),
          "1 ∪ 2 ∪ 3": measure(union(llm, moderation, jcmo), false),
        }
  )
  console.table({ "1. classifieur LLM": measureCalls([...llm.values()]) })

  console.log("\n=== Cas manqués par le classifieur LLM (attendus signalés, non signalés) ===")
  for (const { id, expected, text, note } of CASES.filter(({ expected }) => expected !== "conforme")) {
    const outcome = llm.get(id)
    if (outcome?.flagged) continue
    console.log(`  ${id} [attendu ${expected}${outcome?.unavailable ? ", appel indisponible" : ""}] ${text}${note ? `\n       (${note})` : ""}`)
  }

  console.log("\n=== Faux positifs du classifieur LLM (attendus conformes, signalés) ===")
  for (const { id, text, note } of CASES.filter(({ expected }) => expected === "conforme")) {
    const outcome = llm.get(id)
    if (!outcome?.flagged) continue
    console.log(`  ${id} [${outcome.verdict} / ${outcome.categories.join(", ")}] ${text}${note ? `\n       (${note})` : ""}`)
  }

  if (LLM_ONLY) return

  console.log("\n=== Cas rattrapés uniquement par un détecteur complémentaire ===")
  for (const { id, text } of CASES.filter(({ expected }) => expected !== "conforme")) {
    if (llm.get(id)?.flagged) continue
    const rescuers = [
      moderation.get(id)?.flagged ? `Moderation(${moderation.get(id)?.categories.join(", ")})` : null,
      jcmo.get(id)?.flagged ? `JCMO(${jcmo.get(id)?.categories.join(", ")})` : null,
    ].filter(Boolean)
    if (rescuers.length > 0) console.log(`  ${id} rattrapé par ${rescuers.join(" + ")} — ${text}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
