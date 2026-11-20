// Routes de l'API appelées par le navigateur à travers le BFF de l'UI (/bff/*, cf. app/bff/[...path]/route.ts).
// nginx les ferme à Internet sur /api : l'API de recherche du site n'est pas publique, les intégrateurs passent
// par l'API Apprentissage.

export const BFF_PREFIX = "/bff"

const SEARCH_PATHS = ["/v1/search", "/v1/search/suggest"]
const PRIVATE_PREFIXES = ["/_private/", "/v1/_private/", "/v2/_private/"]

// Candidature : envoyée en direct sur /api, laissé ouvert par nginx (cf. 10_api.conf.template) pour qu'une panne
// ou une limite du BFF ne bloque jamais l'envoi d'une candidature. Correspondance exacte, comme la location nginx.
const DIRECT_API_PATHS = ["/v2/_private/application"]

const normalize = (path: string) => path.split("?")[0].toLowerCase()

/** Recherche du site : exige un jeton de recherche (cf. shared/constants/search-token). */
export const isSearchTokenPath = (path: string): boolean => SEARCH_PATHS.includes(normalize(path).replace(/\/$/, ""))

export const isBffPath = (path: string): boolean => {
  const normalized = normalize(path)
  if (DIRECT_API_PATHS.includes(normalized)) return false
  return isSearchTokenPath(normalized) || PRIVATE_PREFIXES.some((prefix) => normalized.startsWith(prefix))
}
