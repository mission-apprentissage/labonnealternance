// Typage + guard manuels plutôt que zod : ce service part dans des bundles client et
// l'ancien schéma déclarait tous les champs .nullish() — les seuls invariants dont le
// code aval dépend réellement sont les deux niveaux de tableaux, vérifiés ci-dessous.
type ISearchEntrepriseEtablissement = {
  activite_principale?: string | null
  adresse?: string | null
  etat_administratif?: string | null
  nom_commercial?: string | null
  siret?: string | null
  statut_diffusion_etablissement?: string | null
}

type ISearchEntrepriseResult = {
  siren?: string | null
  nom_complet?: string | null
  nom_raison_sociale?: string | null
  activite_principale?: string | null
  etat_administratif?: string | null
  nature_juridique?: string | null
  statut_diffusion?: string | null
  matching_etablissements: ISearchEntrepriseEtablissement[]
}

// Même contrat que l'ancien ZSearchEntrepriseApiResponse.parse : throw si la structure
// attendue (results[] et matching_etablissements[]) n'est pas au rendez-vous.
function parseSearchEntrepriseApiResponse(json: unknown): { results: ISearchEntrepriseResult[] } {
  const results = (json as { results?: unknown })?.results
  if (!Array.isArray(results) || results.some((r) => !Array.isArray(r?.matching_etablissements))) {
    throw new Error(`Réponse inattendue de l'API recherche-entreprises: ${JSON.stringify(json).slice(0, 200)}`)
  }
  return { results }
}

// cf documentation : https://api.gouv.fr/documentation/api-recherche-entreprises
export const searchEntreprise = async (search: string) => {
  if (search.length < 3) {
    return []
  }
  const baseUrl = "https://recherche-entreprises.api.gouv.fr/search"
  const queryParams = new URLSearchParams()
  queryParams.append("q", search)
  queryParams.append("minimal", "true")
  queryParams.append("include", "matching_etablissements")
  const response = await fetch(`${baseUrl}?${queryParams.toString()}`)
  if (response.status >= 400) {
    const body = await response.text()
    throw new Error(`status=${response.status}. body=${body}`)
  }
  const json = await response.json()
  const { results } = parseSearchEntrepriseApiResponse(json)
  return results.flatMap(({ matching_etablissements, nom_complet, nom_raison_sociale }) =>
    matching_etablissements
      .filter(({ etat_administratif }) => etat_administratif === "A")
      .map(({ nom_commercial, siret, adresse, activite_principale }) => ({
        raison_sociale: nom_commercial ?? nom_complet ?? nom_raison_sociale,
        siret,
        adresse,
        activite_principale,
      }))
  )
}
