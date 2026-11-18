// Copie en mémoire du dernier jeton de recherche, envoyée en en-tête au BFF. Repli quand le navigateur refuse
// le cookie partitionné (widget dans une iframe tierce) ; le BFF préfère le cookie quand il est présent.
// Séparé de search-token.client pour ne pas charger altcha-lib avec api.utils.
let searchToken: string | null = null

export const getSearchToken = (): string | null => searchToken

export const setSearchToken = (token: string): void => {
  searchToken = token
}
