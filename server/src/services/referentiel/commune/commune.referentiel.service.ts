import { internal } from "@hapi/boom"
import type { IGeoPoint, IReferentielCommune } from "shared/models/index"

import type { IGeoApiCommune } from "@/common/apis/geoApiGouv/geoApiGouv"
import { getCommuneParCodeDepartement, getDepartements } from "@/common/apis/geoApiGouv/geoApiGouv"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sleep } from "@/common/utils/asyncUtils"

async function updateReferentielCommuneByCommune(commune: IGeoApiCommune): Promise<void> {
  const { code, ...rest } = commune

  await getDbCollection("referentiel.communes").updateOne(
    { code },
    {
      $set: rest,
      $setOnInsert: { code },
    },
    { upsert: true }
  )
}

async function updateReferentielCommuneByDepartement(departement: { code: string }): Promise<void> {
  let communes: IGeoApiCommune[] = []
  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      communes = await getCommuneParCodeDepartement(departement.code)
      break
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }
      await sleep(1000)
    }
  }
  await Promise.all(communes.map(updateReferentielCommuneByCommune))
}

export async function updateReferentielCommune(): Promise<number> {
  const maxAttempts = 3
  let departements: { code: string; nom: string; codeRegion: string }[] = []
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      departements = await getDepartements()
      break
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error
      }
      await sleep(1000)
    }
  }

  await Promise.all(departements.map(updateReferentielCommuneByDepartement))

  return 0
}

// This won't returns the commune of the point, but the nearest commune point
export async function getNearestCommuneByGeoPoint(geo: IGeoPoint): Promise<IReferentielCommune> {
  const commune = await getDbCollection("referentiel.communes").findOne({
    centre: {
      $nearSphere: {
        $geometry: geo,
      },
    },
  })

  if (!commune) {
    throw internal("No commune found for this point", { geo })
  }

  return commune
}

export async function getCommuneByCodeInsee(code: string): Promise<IReferentielCommune | null> {
  return await getDbCollection("referentiel.communes").findOne({
    code,
  })
}

export async function getCommuneByCodePostal(codePostal: string): Promise<IReferentielCommune | null> {
  return await getDbCollection("referentiel.communes").findOne({
    codesPostaux: codePostal,
  })
}
