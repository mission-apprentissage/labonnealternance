import { maskPersonalData } from "@/common/utils/mask-personal-data"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

import {
  CLASSIFICATION_PROMPT_VERSION,
  CLASSIFICATION_SYSTEM_PROMPT,
  escalateVerdict,
  type IOffreClassificationFinding,
  type IOffreClassificationVerdict,
  parseClassification,
} from "./offre-classification.prompt"

/** Modèle figé explicitement : il est stocké avec le verdict pour que celui-ci reste rejouable. */
export const CLASSIFICATION_MODEL = "mistral-large-latest"

export const CLASSIFICATION_FIELDS = ["job_description", "job_employer_description"] as const

export type IClassificationField = (typeof CLASSIFICATION_FIELDS)[number]

export type IClassifiedFinding = IOffreClassificationFinding & { champ: IClassificationField }

export type IOffreClassificationResult = {
  verdict: IOffreClassificationVerdict
  findings: IClassifiedFinding[]
  /**
   * "indisponible" distingue un "a_verifier" dû à une hésitation du modèle d'un "a_verifier" dû à
   * une panne de l'appel. Les deux remplissent la file de revue, mais ce sont deux incidents
   * différents à suivre — sans ce champ, une indisponibilité Mistral ressemble à une hausse du taux
   * de contenus douteux.
   */
  status: "ok" | "indisponible"
  promptVersion: string
  model: string
}

const emptyResult = (status: IOffreClassificationResult["status"], verdict: IOffreClassificationVerdict): IOffreClassificationResult => ({
  verdict,
  findings: [],
  status,
  promptVersion: CLASSIFICATION_PROMPT_VERSION,
  model: CLASSIFICATION_MODEL,
})

/**
 * Étage 1 de la modération (cf #5352) : contrôle de légalité d'un champ libre, sans réécriture.
 *
 * Le classifieur tourne sur le texte masqué — aucune coordonnée brute n'est transmise à l'API
 * tierce — et ne renvoie que des constats. L'amélioration rédactionnelle (#5006) n'est appelée
 * qu'ensuite, et seulement sur un verdict "conforme".
 *
 * Échec de l'appel ou réponse inexploitable ⇒ "a_verifier", JAMAIS "conforme" : contrairement au
 * correcteur rédactionnel, dont la dégradation silencieuse est acceptable, une indisponibilité de
 * l'étage bloquant ne doit pas ouvrir la publication. Les 429 Mistral sont un événement quotidien
 * documenté dans mistralai.service.ts.
 */
export const classifyFreeText = async (rawText: string | null | undefined, champ: IClassificationField): Promise<IOffreClassificationResult> => {
  const trimmed = rawText?.trim()
  // Rien à contrôler : un champ vide ne peut pas porter d'infraction, et n'a pas à être facturé.
  if (!trimmed) return emptyResult("ok", "conforme")

  const response = await sendMistralMessages({
    messages: [
      { role: "system", content: CLASSIFICATION_SYSTEM_PROMPT },
      { role: "user", content: maskPersonalData(trimmed) },
    ],
    model: CLASSIFICATION_MODEL,
  })

  if (!response) return emptyResult("indisponible", "a_verifier")

  const classification = parseClassification(response)
  if (!classification) return emptyResult("indisponible", "a_verifier")

  return {
    verdict: classification.verdict,
    findings: classification.findings.map((finding) => ({ ...finding, champ })),
    status: "ok",
    promptVersion: CLASSIFICATION_PROMPT_VERSION,
    model: CLASSIFICATION_MODEL,
  }
}

/**
 * Contrôle les deux champs libres d'une offre. Le verdict retenu est le plus sévère des deux, et le
 * statut passe à "indisponible" dès qu'un seul des appels a échoué.
 */
export const classifyOffreFreeTexts = async (texts: Partial<Record<IClassificationField, string | null | undefined>>): Promise<IOffreClassificationResult> => {
  const results = await Promise.all(CLASSIFICATION_FIELDS.map((champ) => classifyFreeText(texts[champ], champ)))

  return {
    verdict: results.reduce<IOffreClassificationVerdict>((acc, { verdict }) => escalateVerdict(acc, verdict), "conforme"),
    findings: results.flatMap(({ findings }) => findings),
    status: results.some(({ status }) => status === "indisponible") ? "indisponible" : "ok",
    promptVersion: CLASSIFICATION_PROMPT_VERSION,
    model: CLASSIFICATION_MODEL,
  }
}
