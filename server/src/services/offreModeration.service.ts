import { maskPersonalData } from "@/common/utils/maskPersonalData"
import { sanitizeTextField } from "@/common/utils/string-utils"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

const MODERATION_SYSTEM_PROMPT = `Tu es un assistant de modération et de correction pour des offres d'alternance publiées sur La bonne alternance, un service public français.
Tu reçois un texte rédigé librement par un recruteur (présentation de l'entreprise ou description du poste). Réponds uniquement avec un objet JSON de la forme {"text": "..."}, sans commentaire ni texte hors du JSON.

Règles à appliquer strictement :
1. Corrige l'orthographe, la grammaire et la ponctuation.
2. Améliore la structure et la clarté de la formulation, sans changer le sens ni le fond du texte.
3. Conserve toutes les informations factuelles présentes : responsabilités liées au poste, avantages, compétences, salaire, informations légales de l'entreprise.
4. Supprime ou reformule tout propos discriminant (sexe, origine, apparence physique, situation de famille, grossesse, état de santé, handicap, orientation sexuelle, opinions politiques ou religieuses, âge), haineux, offensant, ou à caractère sexuel.
5. Le texte fourni a déjà ses coordonnées personnelles (téléphone, email, url) masquées : ne tente jamais de les deviner ou de les réintroduire.
6. Si le texte fourni est déjà correct et conforme, renvoie-le tel quel.`

/**
 * Corrige et modère un texte libre saisi par un recruteur (cf #5006) : masquage déterministe des
 * coordonnées personnelles (avant tout envoi à l'API tierce Mistral, et en filet de sécurité après),
 * puis correction orthographe/structure et retraitement des propos discriminants via l'IA.
 * Ne bloque jamais l'appelant : en cas d'échec de l'appel IA, retourne le texte masqué non retravaillé.
 */
export const moderateFreeText = async (rawText: string | null | undefined): Promise<string | null> => {
  const trimmed = rawText?.trim()
  if (!trimmed) return null

  const maskedInput = maskPersonalData(trimmed)

  const response = await sendMistralMessages({
    messages: [
      { role: "system", content: MODERATION_SYSTEM_PROMPT },
      { role: "user", content: maskedInput },
    ],
  })

  if (!response) {
    // échec de l'appel IA (timeout, erreur API) : on ne bloque pas le recruteur, le texte reste
    // masqué mais non retravaillé — la sanitization HTML reste appliquée dans tous les cas.
    return sanitizeTextField(maskedInput, true) || null
  }

  try {
    const parsed = JSON.parse(response)
    const improvedText = typeof parsed?.text === "string" && parsed.text.trim() ? parsed.text.trim() : maskedInput
    // re-masquage + sanitization HTML en filet de sécurité : l'IA ne doit jamais pouvoir réintroduire
    // des coordonnées ou du HTML exécutable dans le texte stocké et rendu via dangerouslySetInnerHTML.
    return sanitizeTextField(maskPersonalData(improvedText), true) || null
  } catch {
    return sanitizeTextField(maskedInput, true) || null
  }
}
