import { EMAIL_MASK, maskPersonalData, PHONE_MASK, URL_MASK } from "@/common/utils/mask-personal-data"
import { sanitizeTextField } from "@/common/utils/string-utils"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

const MODERATION_SYSTEM_PROMPT = `Tu es un assistant de modération et de correction pour des offres d'alternance publiées sur La bonne alternance, un service public français.
Tu reçois un texte rédigé librement par un recruteur (présentation de l'entreprise ou description du poste). Réponds uniquement avec un objet JSON de la forme {"text": "..."}, sans commentaire ni texte hors du JSON.

Règles à appliquer strictement :
1. Corrige l'orthographe, la grammaire et la ponctuation.
2. Améliore la structure et la clarté de la formulation, sans changer le sens ni le fond du texte.
3. Conserve toutes les informations factuelles présentes : responsabilités liées au poste, avantages, compétences, salaire, informations légales de l'entreprise.
4. Supprime ou reformule tout propos discriminant (sexe, origine, apparence physique, situation de famille, grossesse, état de santé, handicap, orientation sexuelle, opinions politiques ou religieuses, âge), haineux, offensant, ou à caractère sexuel.
5. Le texte fourni a déjà ses coordonnées personnelles évidentes (téléphone, email, url au format standard) masquées automatiquement : ne tente jamais de les deviner ou de les réintroduire.
6. Repère aussi toute coordonnée de contact formulée pour contourner ce masquage automatique (numéro épelé ou séparé par des mots, "arobase"/"point" à la place de @/., caractères espacés lettre par lettre, pseudo de réseau social, nom de domaine inhabituel) et remplace-la par le masque correspondant : "${PHONE_MASK}" pour un téléphone, "${EMAIL_MASK}" pour un email, "${URL_MASK}" pour un lien ou nom de domaine.
7. Si le texte fourni est déjà correct et conforme, renvoie-le tel quel.`

/**
 * Corrige et modère un texte libre saisi par un recruteur (cf #5006) : masquage déterministe des
 * coordonnées personnelles (avant tout envoi à l'API tierce Mistral, et en filet de sécurité après),
 * puis correction orthographe/structure, retraitement des propos discriminants, et détection des
 * coordonnées formulées pour contourner le masquage déterministe, via l'IA.
 * Le masquage déterministe reste la garantie en cas d'échec de l'appel IA : ne bloque jamais
 * l'appelant, et retourne alors le texte masqué non retravaillé (l'IA n'est qu'un complément).
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
