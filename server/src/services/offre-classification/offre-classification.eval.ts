/**
 * Harnais d'évals du contrôle de légalité (cf #5352). Lancé à la main, jamais en CI : il appelle
 * les API réelles (Mistral, France Travail), il est facturé et non déterministe.
 *
 *   cd server && set -a && source .env && set +a && npx tsx src/services/offre-classification/offre-classification.eval.ts
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
import { maskPersonalData } from "@/common/utils/mask-personal-data"

import { ADVERSARIAL_CASES, BENIGN_CASES, EVAL_CASES, type IEvalCase } from "./offre-classification.eval-dataset"
import { CLASSIFICATION_SYSTEM_PROMPT, type IOffreClassificationCategory, type IOffreClassificationVerdict, parseClassification } from "./offre-classification.prompt"

const MISTRAL_KEY = process.env.MISTALAI_API_KEY
const FT_CLIENT_ID = process.env.LBA_ESD_CLIENT_ID
const FT_CLIENT_SECRET = process.env.LBA_ESD_CLIENT_SECRET

const CHAT_MODEL = "mistral-large-latest"
const MODERATION_MODEL = "mistral-moderation-latest"
const CONCURRENCY = 4

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

const callMistralChat = async (text: string, attempt = 0): Promise<string | null> => {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${MISTRAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      response_format: { type: "json_object" },
      max_tokens: 2048,
      messages: [
        { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    }),
  })

  if (response.status === 429 && attempt < 3) {
    await sleep([2_000, 10_000, 60_000][attempt])
    return callMistralChat(text, attempt + 1)
  }
  if (!response.ok) {
    console.error(`  chat HTTP ${response.status}`)
    return null
  }

  const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  return payload.choices?.[0]?.message?.content ?? null
}

const runLlmClassifier = async ({ text }: IEvalCase): Promise<IDetectorOutcome> => {
  const raw = await callMistralChat(maskPersonalData(text))
  if (!raw) return { flagged: false, categories: [], unavailable: true }

  const classification = parseClassification(raw)
  if (!classification) return { flagged: false, categories: [], unavailable: true }

  return {
    flagged: classification.verdict !== "conforme",
    verdict: classification.verdict,
    categories: [...new Set(classification.findings.map(({ category }) => category))],
    unavailable: false,
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
  const toFlag = EVAL_CASES.filter(({ expected }) => expected !== "conforme")
  const toPass = EVAL_CASES.filter(({ expected }) => expected === "conforme")

  const flaggedCount = toFlag.filter(({ id }) => outcomes.get(id)?.flagged).length
  const falsePositives = toPass.filter(({ id }) => outcomes.get(id)?.flagged).length
  const metrics: IMetrics = {
    recall: toRate(flaggedCount, toFlag.length),
    falsePositiveRate: toRate(falsePositives, toPass.length),
    unavailable: [...outcomes.values()].filter(({ unavailable }) => unavailable).length,
  }

  if (withVerdict) {
    metrics.exactVerdict = toRate(EVAL_CASES.filter(({ id, expected }) => outcomes.get(id)?.verdict === expected).length, EVAL_CASES.length)
    const withRightCategory = toFlag.filter(({ id, categories }) => {
      const outcome = outcomes.get(id)
      if (!outcome?.flagged || !categories) return false
      return outcome.categories.some((category) => categories.includes(category as IOffreClassificationCategory))
    })
    metrics.rightCategory = toRate(withRightCategory.length, toFlag.filter(({ categories }) => categories).length)
    metrics.fpBloquant = toRate(toPass.filter(({ id }) => outcomes.get(id)?.verdict === "non_conforme").length, toPass.length)
    metrics.fpRevue = toRate(toPass.filter(({ id }) => outcomes.get(id)?.verdict === "a_verifier").length, toPass.length)
    const toBlock = EVAL_CASES.filter(({ expected }) => expected === "non_conforme")
    metrics.blocageAttendu = toRate(toBlock.filter(({ id }) => outcomes.get(id)?.verdict === "non_conforme").length, toBlock.length)
  }

  return metrics
}

const union = (...sources: Map<string, IDetectorOutcome>[]): Map<string, IDetectorOutcome> =>
  new Map(
    EVAL_CASES.map(({ id }) => [
      id,
      {
        flagged: sources.some((source) => source.get(id)?.flagged),
        categories: sources.flatMap((source) => source.get(id)?.categories ?? []),
        unavailable: sources.some((source) => source.get(id)?.unavailable),
      },
    ])
  )

const main = async () => {
  if (!MISTRAL_KEY) throw new Error("MISTALAI_API_KEY manquant")
  console.log(`${EVAL_CASES.length} cas : ${ADVERSARIAL_CASES.length} adversariaux, ${BENIGN_CASES.length} conformes\n`)

  console.log("→ détecteur 1 : classifieur LLM")
  const llmResults = await mapWithConcurrency(EVAL_CASES, CONCURRENCY, async (evalCase) => [evalCase.id, await runLlmClassifier(evalCase)] as const)
  const llm = new Map(llmResults)

  console.log("→ détecteur 2 : API Moderation Mistral")
  const moderation = await runModeration(EVAL_CASES)

  console.log("→ détecteur 3 : JCMO France Travail")
  let jcmo = new Map<string, IDetectorOutcome>()
  const token = FT_CLIENT_ID && FT_CLIENT_SECRET ? await getFranceTravailToken() : null
  if (!token) {
    console.log("  identifiants France Travail absents ou refusés : détecteur ignoré")
    jcmo = new Map(EVAL_CASES.map(({ id }) => [id, { flagged: false, categories: [], unavailable: true }]))
  } else {
    // 10 appels/seconde autorisés sur la clé : la concurrence de 4 avec pause reste très en dessous.
    const jcmoResults = await mapWithConcurrency(EVAL_CASES, CONCURRENCY, async (evalCase) => [evalCase.id, await runJcmo(evalCase, token)] as const)
    jcmo = new Map(jcmoResults)
  }

  console.log("\n=== Mesures ===")
  console.table({
    "1. classifieur LLM": measure(llm, true),
    "2. Moderation Mistral": measure(moderation, false),
    "3. JCMO France Travail": measure(jcmo, false),
    "1 ∪ 2": measure(union(llm, moderation), false),
    "1 ∪ 3": measure(union(llm, jcmo), false),
    "1 ∪ 2 ∪ 3": measure(union(llm, moderation, jcmo), false),
  })

  console.log("\n=== Cas manqués par le classifieur LLM (attendus signalés, non signalés) ===")
  for (const { id, expected, text, note } of EVAL_CASES.filter(({ expected }) => expected !== "conforme")) {
    const outcome = llm.get(id)
    if (outcome?.flagged) continue
    console.log(`  ${id} [attendu ${expected}${outcome?.unavailable ? ", appel indisponible" : ""}] ${text}${note ? `\n       (${note})` : ""}`)
  }

  console.log("\n=== Faux positifs du classifieur LLM (attendus conformes, signalés) ===")
  for (const { id, text, note } of EVAL_CASES.filter(({ expected }) => expected === "conforme")) {
    const outcome = llm.get(id)
    if (!outcome?.flagged) continue
    console.log(`  ${id} [${outcome.verdict} / ${outcome.categories.join(", ")}] ${text}${note ? `\n       (${note})` : ""}`)
  }

  console.log("\n=== Cas rattrapés uniquement par un détecteur complémentaire ===")
  for (const { id, text } of EVAL_CASES.filter(({ expected }) => expected !== "conforme")) {
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
