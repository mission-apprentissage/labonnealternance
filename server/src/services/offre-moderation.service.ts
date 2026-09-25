import { EMAIL_MASK, maskPersonalData, PHONE_MASK, URL_MASK } from "@/common/utils/mask-personal-data"
import { sanitizeTextField } from "@/common/utils/string-utils"
import { sendMistralMessages } from "@/services/mistralai/mistralai.service"

const PII_RULES = [
  `Le texte fourni a déjà ses coordonnées personnelles évidentes (téléphone, email, url au format standard) masquées automatiquement : ne tente jamais de les deviner ou de les réintroduire, et ne les présente pas comme une adresse où écrire.`,
  `Repère aussi toute coordonnée de contact formulée pour contourner ce masquage automatique (numéro épelé ou séparé par des mots, "arobase"/"point" à la place de @/., caractères espacés lettre par lettre, pseudo de réseau social, nom de domaine inhabituel) et remplace-la par le masque correspondant : "${PHONE_MASK}" pour un téléphone, "${EMAIL_MASK}" pour un email, "${URL_MASK}" pour un lien ou nom de domaine.`,
]

const FACTS_RULE = `Conserve toutes les informations factuelles présentes : responsabilités liées au poste, avantages, compétences, salaire, informations légales de l'entreprise.`

const buildPrompt = (
  rules: string[]
): string => `Tu es un assistant de modération et de correction pour des offres d'alternance publiées sur La bonne alternance, un service public français.
Tu reçois un texte rédigé librement par un recruteur (présentation de l'entreprise ou description du poste). Réponds uniquement avec un objet JSON de la forme {"text": "..."}, sans commentaire ni texte hors du JSON.

Règles à appliquer strictement :
${rules.map((rule, index) => `${index + 1}. ${rule}`).join("\n")}`

/**
 * Passe appliquée à chaque enregistrement, sans que le recruteur ne l'ait demandée. Son seul office
 * est le masquage des coordonnées de contact, y compris celles formulées pour contourner le masquage
 * déterministe. Elle ne juge pas le contenu et n'en retire rien : le texte enregistré doit être celui
 * que le recruteur a validé à l'écran, sans quoi le classifieur (#5497) et la relecture humaine
 * porteraient sur un texte qui n'est plus le sien.
 */
const MODERATION_SYSTEM_PROMPT = buildPrompt([
  `Ne corrige pas l'orthographe, la grammaire ni la ponctuation.`,
  `Ne reformule pas, ne restructure pas, ne raccourcis pas, n'ajoute rien : la formulation du recruteur doit être conservée mot pour mot.`,
  `Ne supprime aucun contenu, même problématique (discriminant, illégal, trompeur) : son évaluation relève d'un contrôle distinct, l'effacer ici priverait ce contrôle du texte réel.`,
  FACTS_RULE,
  ...PII_RULES,
  `Le masquage des coordonnées décrit ci-dessus est ta seule modification autorisée. Si le texte n'en contient aucune, renvoie-le à l'identique, caractère pour caractère.`,
])

/**
 * Passe de confort, déclenchée explicitement par le recruteur via le CTA "Améliorer" : sa sortie lui
 * est proposée dans l'encart, à lui d'arbitrer.
 *
 * Elle ne touche jamais au fond, y compris fautif. Mesuré sur un texte de test saturé de mentions
 * illégales, l'ancienne consigne "supprime les propos discriminants" ne produisait pas une
 * suppression mais une réécriture : sur 5 tirages, 3 inventaient une offre licite (durée du travail,
 * tranche d'âge, date de signature du contrat, agrément du centre de formation) et 5 affirmaient une
 * conformité absente du texte source. Le recruteur se voyait proposer, sous le nom de son
 * entreprise, des engagements qu'il n'avait pas pris. Juger la légalité revient au classifieur
 * (#5497) ; corriger la forme sans altérer le fond est ce qui lui permet de juger le vrai texte.
 */
const IMPROVEMENT_SYSTEM_PROMPT = buildPrompt([
  `Corrige l'orthographe, la grammaire et la ponctuation.`,
  `Améliore la structure et la clarté de la formulation, sans changer le sens ni le fond du texte.`,
  FACTS_RULE,
  `N'introduis aucune information absente du texte source. N'ajoute ni engagement, ni mention de conformité, de légalité ou de réglementation, ni horaire, ni durée, ni rémunération, ni condition de contrat que le recruteur n'a pas écrits. Le texte est publié en son nom.`,
  `Ne supprime pas et ne reformule pas les propos problématiques (discriminants, illégaux, trompeurs) : ils relèvent d'un contrôle distinct, pas de la correction rédactionnelle. Laisse-les tels quels.`,
  ...PII_RULES,
  `Réponds en texte brut, sans markdown : pas de listes à puces introduites par - ou *, pas de liens, pas de gras. Le texte est réinjecté tel quel dans un champ de saisie.`,
  `Si le texte fourni est déjà correct, renvoie-le tel quel.`,
])

/**
 * Masquage déterministe des coordonnées personnelles (avant tout envoi à l'API tierce Mistral, et en
 * filet de sécurité après), puis passe IA. Le masquage déterministe reste la garantie en cas d'échec
 * de l'appel : ne bloque jamais l'appelant, et retourne alors le texte masqué non retravaillé.
 */
const runTextPass = async (systemPrompt: string, rawText: string | null | undefined): Promise<string | null> => {
  const trimmed = rawText?.trim()
  if (!trimmed) return null

  const maskedInput = maskPersonalData(trimmed)

  const response = await sendMistralMessages({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: maskedInput },
    ],
  })

  if (!response) {
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

/** Modération d'un texte libre saisi par un recruteur (cf #5006), appliquée à chaque enregistrement. */
export const moderateFreeText = (rawText: string | null | undefined): Promise<string | null> => runTextPass(MODERATION_SYSTEM_PROMPT, rawText)

/** Réécriture de confort, sur demande explicite du recruteur (cf. AmeliorerIaPanel). */
export const improveFreeText = (rawText: string | null | undefined): Promise<string | null> => runTextPass(IMPROVEMENT_SYSTEM_PROMPT, rawText)
