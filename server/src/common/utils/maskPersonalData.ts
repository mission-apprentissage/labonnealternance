const PHONE_REGEX = /(?:\+33[\s.-]?|0)[1-9](?:[\s.-]?\d{2}){4}\b/g
const EMAIL_REGEX = /[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}/g
// url avec protocole ou préfixe www : bornée par les espaces/ponctuation (pas de sur-capture de la ponctuation de fin de phrase)
const URL_WITH_PREFIX_REGEX = /\b(?:https?:\/\/|www\.)[^\s,;:!?()<>"'«»]+/gi
// domaine nu sans www/protocole (ex: "voir entreprise.fr") : bornée par \b, insensible à la ponctuation adjacente
const BARE_DOMAIN_REGEX = /\b[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.(?:gouv\.fr|asso\.fr|co\.uk|fr|com|net|org|io|co|eu|info|biz)\b/gi

const PHONE_MASK = "06xxxxxxxx"
const EMAIL_MASK = "emxxx@xxx.fr"
const URL_MASK = "www.lien_non_disponible.com"

// ponctuation de fin de phrase pouvant suivre un match sans espace (à ne jamais inclure dans le masque)
const TRAILING_PUNCTUATION_REGEX = /[.,;:!?)\]}>"'»]+$/

const maskMatches = (text: string, regex: RegExp, mask: string, skip?: (index: number) => boolean): string => {
  const matches = [...text.matchAll(regex)].filter((m) => !skip?.(m.index))
  if (matches.length === 0) return text

  let result = text
  for (const match of [...matches].reverse()) {
    const index = match.index
    const length = match[0].length - (match[0].match(TRAILING_PUNCTUATION_REGEX)?.[0].length ?? 0)
    result = result.substring(0, index) + mask + result.substring(index + length)
  }
  return result
}

/**
 * Masque les coordonnées personnelles (téléphone, email, url) détectées dans un texte libre,
 * pour la modération des descriptions d'offre saisies librement par les recruteurs (cf #5006).
 * Remplace par des formats prédéfinis plutôt que de supprimer, pour ne pas casser la lisibilité
 * du texte autour. Regex dédiées (plutôt que shared/utils/detectUrlAndEmails) : ce dernier perd
 * les matches dont le domaine est directement suivi d'une ponctuation sans espace (ex: "fr,"),
 * un cas trop fréquent en prose libre pour une fonctionnalité de modération.
 */
export const maskPersonalData = (text: string): string => {
  if (!text) return text

  let masked = text.replace(PHONE_REGEX, PHONE_MASK)
  // url avant email : évite qu'une adresse email déjà masquée en "emxxx@xxx.fr" ne soit re-capturée
  // par la détection de domaine nu ("xxx.fr") lors d'un passage ultérieur.
  masked = maskMatches(masked, URL_WITH_PREFIX_REGEX, URL_MASK)
  masked = maskMatches(masked, BARE_DOMAIN_REGEX, URL_MASK, (index) => masked[index - 1] === "@")
  masked = maskMatches(masked, EMAIL_REGEX, EMAIL_MASK)

  return masked
}
