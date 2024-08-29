import { internal } from "@hapi/boom"
import { IGeoPoint, IReferentielCommune } from "shared/models"

import { getCommuneParCodeDepartement, getDepartements, IGeoApiCommune } from "@/common/apis/geoApiGouv/geoApiGouv"
import { getDbCollection } from "@/common/utils/mongodbUtils"

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
  const communes = await getCommuneParCodeDepartement(departement.code)
  await Promise.all(communes.map(updateReferentielCommuneByCommune))
}

export async function updateReferentielCommune(): Promise<number> {
  const departements = await getDepartements()

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
