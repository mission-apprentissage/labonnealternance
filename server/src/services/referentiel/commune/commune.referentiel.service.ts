import { internal } from "@hapi/boom"
import type { IGeoPoint, IReferentielCommune } from "shared/models/index"

import type { IGeoApiCommune } from "@/common/apis/geo-api-gouv/geo-api-gouv"
import { getCommuneParCodeDepartement, getDepartements } from "@/common/apis/geo-api-gouv/geo-api-gouv"
import { sleep } from "@/common/utils/async-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"

let inseeToCodesPostaux: Record<string, string[]> | null = null

async function getInseeToCodesPostauxMapping(): Promise<Record<string, string[]>> {
  if (inseeToCodesPostaux) {
    return inseeToCodesPostaux
  }
  const communes = await getDbCollection("referentiel.communes")
    .find({}, { projection: { _id: 0, code: 1, codesPostaux: 1 } })
    .toArray()
  inseeToCodesPostaux = Object.fromEntries(communes.map(({ code, codesPostaux }) => [code, codesPostaux]))
  return inseeToCodesPostaux
}

export async function getCodePostalFromInsee(codeInsee: string): Promise<string | null> {
  const mapping = await getInseeToCodesPostauxMapping()
  return mapping[codeInsee]?.[0] ?? null
}

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

type ICommuneCentreLabel = Pick<IReferentielCommune, "centre" | "nom">

export async function getCommuneByCodeInsee(code: string): Promise<ICommuneCentreLabel | null> {
  return await getDbCollection("referentiel.communes").findOne({ code }, { projection: { centre: 1, nom: 1 } })
}

export async function getCommuneByCodePostal(codePostal: string): Promise<ICommuneCentreLabel | null> {
  return await getDbCollection("referentiel.communes").findOne({ codesPostaux: codePostal }, { projection: { centre: 1, nom: 1 } })
}

// Commune « principale » d'un ou plusieurs départements : celle qui porte le plus de codes postaux
// (Paris, Marseille, Lyon, Nice…). Repli quand un code postal n'existe pas dans le référentiel,
// typiquement un CEDEX, pour conserver une recherche localisée.
export async function getCommunePrincipaleByCodesDepartement(codesDepartement: string[]): Promise<ICommuneCentreLabel | null> {
  const [commune] = await getDbCollection("referentiel.communes")
    .aggregate<ICommuneCentreLabel>([
      { $match: { codeDepartement: { $in: codesDepartement } } },
      { $addFields: { nbCodesPostaux: { $size: { $ifNull: ["$codesPostaux", []] } } } },
      { $sort: { nbCodesPostaux: -1, code: 1 } },
      { $limit: 1 },
      { $project: { _id: 0, centre: 1, nom: 1 } },
    ])
    .toArray()
  return commune ?? null
}
