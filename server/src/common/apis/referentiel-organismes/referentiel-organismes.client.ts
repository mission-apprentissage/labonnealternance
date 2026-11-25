import axios from "axios"
import { z } from "zod"

import { getHttpClient } from "@/common/utils/http-utils"

export const REFERENTIEL_ORGANISMES_API_URL = "https://referentiel.apprentissage.onisep.fr/api/v1"

/** Le Référentiel compte environ 11 500 organismes : une page suffit, la boucle ne sert que si l'API plafonne la taille. */
const PAGE_SIZE = 20_000

const ZOrganismesPage = z.object({
  pagination: z.object({ page: z.number().int(), nombre_de_page: z.number().int().nonnegative(), total: z.number().int().nonnegative() }),
  organismes: z.array(z.object({ siret: z.string() })),
})

/** La liste complète pèse environ 300 Ko : timeout élargi pour elle seule. */
const LIST_TIMEOUT_MS = 120_000

const client = getHttpClient({ baseURL: REFERENTIEL_ORGANISMES_API_URL })

/** SIRET de tous les organismes du Référentiel. Lève une erreur si les SIRET reçus ne couvrent pas exactement le total annoncé. */
export const getReferentielOrganismesSirets = async (): Promise<Set<string>> => {
  const sirets = new Set<string>()
  let total: number | null = null
  for (let page = 1; ; page++) {
    const { data } = await client.get("/organismes", { params: { page, items_par_page: PAGE_SIZE, champs: "siret" }, timeout: LIST_TIMEOUT_MS })
    const { pagination, organismes } = ZOrganismesPage.parse(data)
    if (total !== null && pagination.total !== total) {
      throw new Error(`Référentiel Onisep : total passé de ${total} à ${pagination.total} pendant la lecture des pages`)
    }
    total = pagination.total
    for (const { siret } of organismes) sirets.add(siret)
    if (page >= pagination.nombre_de_page) break
  }
  if (sirets.size !== total) {
    throw new Error(`Référentiel Onisep : ${sirets.size} SIRET distincts reçus pour un total annoncé de ${total}`)
  }
  return sirets
}

export type IReferentielOrganismePresence = { kind: "present" } | { kind: "absent" } | { kind: "error"; reason: string }

/** Seul un 404 signifie l'absence, comme à la création de compte (cf. validateEligibiliteCfa). */
export const getReferentielOrganismePresence = async (siret: string): Promise<IReferentielOrganismePresence> => {
  try {
    const { data } = await client.get(`/organismes/${siret}`)
    const parsed = z.object({ siret: z.string() }).safeParse(data)
    if (!parsed.success || parsed.data.siret !== siret) return { kind: "error", reason: "réponse 200 illisible" }
    return { kind: "present" }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) return { kind: "absent" }
      return { kind: "error", reason: error.response ? `HTTP ${error.response.status}` : "sans réponse" }
    }
    throw error
  }
}
