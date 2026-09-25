/**
 * Paramètres d'URL enregistrés avec un affichage ou une réponse de feedback, débarrassés de ce qui
 * pourrait identifier une personne. Certaines pages du site portent un `token` ou un `email` dans
 * l'URL (désinscription, pages premium, validation de compte) : ils ne doivent jamais être stockés.
 * Liste d'exclusion plutôt que liste autorisée : un paramètre nouveau reste exploitable dans
 * Metabase sans passer par le back-office.
 */

export type IFeedbackUrlParams = Record<string, string | string[]>

export const FEEDBACK_URL_PARAMS_MAX_KEYS = 20
export const FEEDBACK_URL_PARAM_MAX_LENGTH = 200
const MAX_VALUES_PER_KEY = 10

// comparées sans casse, ni tirets, ni tirets bas : « first_name », « firstName » et « First-Name » sont une même clé
const EXCLUDED_KEYS = new Set(
  [
    "token",
    "accesstoken",
    "refreshtoken",
    "jwt",
    "auth",
    "authorization",
    "apikey",
    "password",
    "pwd",
    "secret",
    "email",
    "mail",
    "courriel",
    "phone",
    "telephone",
    "tel",
    "mobile",
    "firstname",
    "lastname",
    "prenom",
    "nom",
    "address",
    "adresse",
  ].map((key) => key.toLowerCase())
)

const normalizeKey = (key: string) => key.toLowerCase().replace(/[-_]/g, "")

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/
const JWT = /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/
const isFrenchPhone = (value: string) => /^(?:0[1-9]\d{8}|(?:\+|00)33[1-9]\d{8})$/.test(value.replace(/[\s.-]/g, ""))

/** Valeur conservée ? Non si elle ressemble à un email, un téléphone ou un jeton, ou si elle est trop longue. */
const isStorableValue = (value: string) => value.length <= FEEDBACK_URL_PARAM_MAX_LENGTH && !EMAIL.test(value) && !JWT.test(value) && !isFrenchPhone(value)

export function sanitizeFeedbackUrlParams(params: IFeedbackUrlParams): IFeedbackUrlParams {
  const sanitized: IFeedbackUrlParams = {}
  for (const [key, raw] of Object.entries(params)) {
    if (Object.keys(sanitized).length >= FEEDBACK_URL_PARAMS_MAX_KEYS) break
    if (key.length > FEEDBACK_URL_PARAM_MAX_LENGTH || EXCLUDED_KEYS.has(normalizeKey(key))) continue
    const values = [raw].flat().filter(isStorableValue).slice(0, MAX_VALUES_PER_KEY)
    if (values.length === 0) continue
    sanitized[key] = Array.isArray(raw) ? values : values[0]
  }
  return sanitized
}
