import axios from "axios"
import z from "zod"
import config from "@/config"

import { delay } from "@/common/utils/asyncUtils"
import { logger } from "@/common/logger"

const ZEmploiInclusionLieu = z.object({
  nom: z.string(),
  departement: z.string(),
  code_postaux: z.array(z.string()),
  code_insee: z.string(),
})

const ZEmploiInclusionPoste = z.object({
  id: z.number(),
  rome: z.string(),
  cree_le: z.string().datetime({ offset: true }),
  mis_a_jour_le: z.string().datetime({ offset: true }),
  recrutement_ouvert: z.string(),
  description: z.string(),
  appellation_modifiee: z.string(),
  type_contrat: z.string(),
  nombre_postes_ouverts: z.number(),
  lieu: ZEmploiInclusionLieu.nullable(),
  profil_recherche: z.string(),
})

export const ZEmploiInclusionJob = z.object({
  id: z.string().uuid(),
  cree_le: z.string().datetime({ offset: true }),
  mis_a_jour_le: z.string().datetime({ offset: true }),
  siret: z.string(),
  type: z.string(),
  raison_sociale: z.string(),
  enseigne: z.string(),
  telephone: z.string(),
  courriel: z.string(),
  site_web: z.string(),
  description: z.string(),
  bloque_candidatures: z.boolean(),
  addresse_ligne_1: z.string(),
  addresse_ligne_2: z.string(),
  code_postal: z.string(),
  ville: z.string(),
  departement: z.string(),
  postes: z.array(ZEmploiInclusionPoste),
})

export type IEmploiInclusionJob = z.output<typeof ZEmploiInclusionJob>

const ZEmploiInclusionResponse = z.object({
  count: z.number(),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  results: z.array(ZEmploiInclusionJob),
})

const MAX_RETRIES = 3

const getEmploiInclusionJobs = async (url: string, attempt = 1): Promise<z.output<typeof ZEmploiInclusionResponse>> => {
  try {
    const response = await axios.get(url)
    return ZEmploiInclusionResponse.parse(response.data)
  } catch (err: any) {
    logger.error({ status: err?.response?.status, data: err?.response?.data, url }, "emploi-inclusion: erreur API")
    if (err?.response?.status === 429 && attempt <= MAX_RETRIES) {
      const retryAfterMs = (parseInt(err.response.headers["retry-after"] ?? "10", 10) || 10) * 1_000
      await delay(retryAfterMs)
      return getEmploiInclusionJobs(url, attempt + 1)
    }
    throw err
  }
}

/**
 * API Doc : https://emplois.inclusion.beta.gouv.fr/api/v1/redoc/#tag/siaes/operation/siaes_list
 */
export const getAllEmploiInclusionJobsByDepartement = async (departement: string): Promise<IEmploiInclusionJob[]> => {
  const allResults: IEmploiInclusionJob[] = []
  let nextUrl: string | null = `${config.emploi_inclusion.url}/api/v1/siaes/?departement=${departement}`

  while (nextUrl) {
    const page = await getEmploiInclusionJobs(nextUrl)
    allResults.push(...page.results)
    nextUrl = page.next
  }

  return allResults
}
