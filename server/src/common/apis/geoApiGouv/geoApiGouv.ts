import { internal } from "@hapi/boom"
import { IReferentielCommune, zReferentielCommune } from "shared/models"
import { z } from "zod"

import { apiRateLimiter } from "@/common/utils/apiUtils"

import getApiClient from "../client"

const zGeoApiCommune = zReferentielCommune.omit({ _id: true })

export type IGeoApiCommune = Omit<IReferentielCommune, "_id">

const executeWithRateLimiting = apiRateLimiter("apiBal", {
  nbRequests: 50,
  durationInSeconds: 1,
  client: getApiClient({ baseURL: "https://geo.api.gouv.fr" }),
  maxQueueSize: 1_000,
})

export async function getCommuneParCodeInsee(insee: string): Promise<IGeoApiCommune> {
  return executeWithRateLimiting(async (client) => {
    try {
      const { data } = await client.get(`/communes/${insee}`, {
        params: {
          fields: "code,codeParent,codesPostaux,centre,bbox,codeDepartement,codeRegion",
          geometry: "centre",
        },
      })
      return zGeoApiCommune.parse(data)
    } catch (error) {
      const err = internal("Error while fetching commune by insee code", { insee })
      err.cause = error
      throw err
    }
  })
}

const zGeoApiDepartement = z.object({
  nom: z.string(),
  code: z.string(),
  codeRegion: z.string(),
})
export type IGeoApiDepartement = z.output<typeof zGeoApiDepartement>

export async function getDepartements(): Promise<IGeoApiDepartement[]> {
  return executeWithRateLimiting(async (client) => {
    try {
      const { data } = await client.get(`/departements`, {
        params: {
          fields: "nom,code,codeRegion",
        },
      })
      return z.array(zGeoApiDepartement).parse(data)
    } catch (error) {
      const err = internal("Error while fetching departements")
      err.cause = error
      throw err
    }
  })
}

export async function getCommuneParCodeDepartement(code: string): Promise<IGeoApiCommune[]> {
  return executeWithRateLimiting(async (client) => {
    try {
      const { data } = await client.get(`/departements/${code}/communes`, {
        params: {
          fields: "code,codeParent,codesPostaux,centre,bbox,codeDepartement,codeRegion",
          geometry: "centre",
        },
      })
      return z.array(zGeoApiCommune).parse(data)
    } catch (error) {
      const err = internal("Error while fetching communes by department code", { code })
      err.cause = error
      throw err
    }
  })
}
