import { z } from "zod"

import { sleep } from "@/utils/tools"

const ZSearchEntrepriseApiResponse = z.object({
  results: z.array(
    z.object({
      siren: z.string().nullish(),
      nom_complet: z.string().nullish(),
      nom_raison_sociale: z.string().nullish(),
      activite_principale: z.string().nullish(),
      etat_administratif: z.string().nullish(),
      nature_juridique: z.string().nullish(),
      statut_diffusion: z.string().nullish(),
      matching_etablissements: z.array(
        z.object({
          activite_principale: z.string().nullish(),
          adresse: z.string().nullish(),
          etat_administratif: z.string().nullish(),
          nom_commercial: z.string().nullish(),
          siret: z.string().nullish(),
          statut_diffusion_etablissement: z.string().nullish(),
        })
      ),
    })
  ),
})

const MAX_RETRIES = 3
const DEFAULT_RETRY_AFTER_SECONDS = 1

const fetchWithRetry = async (url: string, attempt = 1): Promise<Response> => {
  const response = await fetch(url)
  if (response.status === 429 && attempt < MAX_RETRIES) {
    const retryAfterMs = (parseInt(response.headers.get("retry-after") ?? String(DEFAULT_RETRY_AFTER_SECONDS), 10) || DEFAULT_RETRY_AFTER_SECONDS) * 1_000
    await sleep(retryAfterMs)
    return fetchWithRetry(url, attempt + 1)
  }
  return response
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
  const response = await fetchWithRetry(`${baseUrl}?${queryParams.toString()}`)
  if (response.status >= 400) {
    const body = await response.text()
    throw new Error(`status=${response.status}. body=${body}`)
  }
  const json = await response.json()
  const { results } = ZSearchEntrepriseApiResponse.parse(json)
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
