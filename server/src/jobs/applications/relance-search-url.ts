import { resolveSearchParamsFromUrl, SEARCH_PAGE_PATH } from "shared/utils/search-url-compat"

// Remet à zéro ce qui ne doit pas survivre au rejeu d'une recherche par email : la page, les utm
// capturés dans l'URL d'origine et le filtre de typologie. Le moteur mixe offres et entreprises à
// contacter, les liens email visent les deux (#5394).
export const resetReplayedSearchParams = (searchParams: URLSearchParams) => {
  searchParams.delete("page")
  searchParams.delete("is_algo_company")
  for (const utmParam of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    searchParams.delete(utmParam)
  }
}

// Lien de recherche des emails de relance, reconstruit depuis `applications.application_url` (le
// `window.location.href` au moment de la candidature). Deux formes coexistent en base : fiche détail
// `/emploi/…?from=%2Frecherche%3Fq%3D…` (recherche d'origine dans `from`) et URL legacy
// (`?romes=…&job_name=…&lat=…`) ; `resolveSearchParamsFromUrl` les ramène au schéma du nouveau moteur.
export const buildTaggedSearchUrl = (
  application_url: string | null | undefined,
  { utmCampaign, highlightRecruteursLba = false }: { utmCampaign: string; highlightRecruteursLba?: boolean }
): string | null => {
  if (!application_url) {
    return null
  }
  let url: URL
  try {
    url = new URL(application_url)
  } catch {
    return null
  }

  // On ne garde que les recherches réellement exploitables (un métier, ou à défaut un lieu :
  // rejouer « les offres autour de Marseille » vaut mieux que renvoyer sur des résultats nus).
  const searchParams = resolveSearchParamsFromUrl(url)
  if (searchParams === null) {
    return null
  }

  resetReplayedSearchParams(searchParams)
  if (highlightRecruteursLba) {
    searchParams.set("is_algo_company", "true")
  }
  searchParams.set("utm_source", "lba-brevo")
  searchParams.set("utm_medium", "email")
  searchParams.set("utm_campaign", utmCampaign)

  const searchUrl = new URL(url.origin)
  searchUrl.pathname = SEARCH_PAGE_PATH
  searchUrl.search = searchParams.toString()
  return searchUrl.toString()
}
