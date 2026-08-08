// Reconstruit un lien de recherche LBA à partir de l'URL exacte de la dernière candidature d'un candidat
// (`applications.application_url`), pour les emails de relance. Partagé par les boucles de relance.
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
  if (url.pathname.startsWith("/emploi/")) {
    url.pathname = "/recherche"
  }
  // On ne garde que les recherches réellement exploitables (au moins un métier)
  if (!url.searchParams.get("romes") && !url.searchParams.get("rncp")) {
    return null
  }
  // Met en avant les entreprises où candidater spontanément (recruteurs LBA) sur la page de recherche
  if (highlightRecruteursLba) {
    url.searchParams.delete("scrollToRecruteursLba")
    url.searchParams.set("scrollToRecruteursLba", "true")
  }
  // On retire tous les UTM éventuellement capturés dans l'URL d'origine avant de poser les nôtres
  for (const utmParam of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    url.searchParams.delete(utmParam)
  }
  url.searchParams.set("utm_source", "lba-brevo")
  url.searchParams.set("utm_medium", "email")
  url.searchParams.set("utm_campaign", utmCampaign)
  return url.toString()
}
