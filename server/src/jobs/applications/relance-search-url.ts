import { resolveSearchParamsFromUrl, SEARCH_PAGE_PATH } from "shared/utils/search-url-compat"

// Reconstruit un lien de recherche LBA à partir de l'URL exacte de la dernière candidature d'un candidat
// (`applications.application_url`), pour les emails de relance. Partagé par les boucles de relance.
//
// `application_url` est le `window.location.href` au moment de la candidature : depuis la bascule du
// nouveau moteur c'est une fiche détail `/emploi/…?from=%2Frecherche%3Fq%3D…` (la recherche d'origine
// est dans `from`), et avant c'était une URL au format legacy (`?romes=…&job_name=…&lat=…`). Les deux
// formes coexistent en base ; `resolveSearchParamsFromUrl` les ramène au schéma du nouveau moteur.
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

  // La relance repart du début de la liste : la page où le candidat s'était arrêté n'a plus de sens
  // une semaine plus tard, et le lien serait partagé tel quel.
  searchParams.delete("page")

  // Met en avant les entreprises où candidater spontanément (recruteurs LBA) sur la page de recherche
  if (highlightRecruteursLba) {
    searchParams.set("is_algo_company", "true")
  }
  // On retire tous les UTM éventuellement capturés dans l'URL d'origine avant de poser les nôtres
  for (const utmParam of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    searchParams.delete(utmParam)
  }
  searchParams.set("utm_source", "lba-brevo")
  searchParams.set("utm_medium", "email")
  searchParams.set("utm_campaign", utmCampaign)

  const searchUrl = new URL(url.origin)
  searchUrl.pathname = SEARCH_PAGE_PATH
  searchUrl.search = searchParams.toString()
  return searchUrl.toString()
}
