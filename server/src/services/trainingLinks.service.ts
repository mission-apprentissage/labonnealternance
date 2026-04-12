import { getDistance } from "geolib"
import type { IFormationCatalogue, IReferentielCommune } from "shared/models/index"
import { URL } from "url"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config.js"
import { getRomesFromRncp } from "./external/api-alternance/certification.service"
import { filterWrongRomes } from "./formation.service"
import { getCommuneByCodeInsee, getCommuneByCodePostal } from "./referentiel/commune/commune.referentiel.service"
import { expandRomesV3toV4 } from "./rome.service"

interface IWish {
  id: string
  cle_ministere_educatif?: string | null
  mef?: string | null
  cfd?: string | null
  rncp?: string | null
  code_postal?: string | null
  uai?: string | null
  uai_lieu_formation?: string | null
  uai_formateur?: string | null
  uai_formateur_responsable?: string | null
  code_insee?: string | null
  utm_data?: {
    utm_source: string
    utm_medium: string
    utm_campaign: string
  }
}

interface ILinks {
  id: string
  lien_prdv: string
  lien_lba: string
}

const defaultUtmData = { utm_source: "lba", utm_medium: "email", utm_campaign: "promotion-emploi-jeunes-voeux" }

const buildEmploiUrl = ({ baseUrl = `${config.publicUrl}/recherche-emploi`, params }: { baseUrl?: string; params: Record<string, string | string[] | null | undefined> }) => {
  const url = new URL(baseUrl)

  Object.entries(params).forEach(([key, value]) => {
    // @ts-expect-error
    if (value) url.searchParams.append(key, value)
  })
  return url.toString()
}

const getFormations = (
  query: object,
  filter: object = {
    lieu_formation_geo_coordonnees: 1,
    rome_codes: 1,
    _id: 0,
  }
) => getDbCollection("formationcatalogues").find(query, filter).toArray()

const getTrainingsFromParameters = async (wish: IWish, formationsByCle?: Map<string, IFormationCatalogue[]>): Promise<IFormationCatalogue[]> => {
  let formations
  let query: any = { $or: [] }

  if (wish.cfd) {
    query.$or.push({ cfd: wish.cfd })
  }
  if (wish.rncp) {
    query.$or.push({ rncp_code: wish.rncp })
  }
  if (wish.mef) {
    query.$or.push({ "bcn_mefs_10.mef10": wish.mef })
  }

  if (!query.$or.length) {
    query = undefined
  }
  // search by cle ME
  if (wish.cle_ministere_educatif) {
    formations = formationsByCle ? (formationsByCle.get(wish.cle_ministere_educatif) ?? []) : await getFormations({ cle_ministere_educatif: wish.cle_ministere_educatif })
  }

  // KBA 2024_07_29 : commenté en attendant la remonté du champ uai_formation dans le catalogue RCO
  // if (!formations || !formations.length) {
  //   // search by uai_lieu_formation
  //   if (wish.uai_lieu_formation) {
  //     formations = await getFormations({ $or: [{ cfd: wish.cfd }, { rncp_code: wish.rncp }, { "bcn_mefs_10.mef10": wish.mef }], uai_formation: wish.uai_lieu_formation })
  //   }
  // }

  if (!formations || !formations.length) {
    // search by uai_formateur
    if (wish.uai_formateur) {
      formations = await getFormations({ ...query, etablissement_formateur_uai: wish.uai_formateur })
    }
  }

  if (!formations || !formations.length) {
    // search by uai_formateur_responsable
    if (wish.uai_formateur_responsable) {
      formations = await getFormations({ ...query, etablissement_gestionnaire_uai: wish.uai_formateur_responsable })
    }
  }

  // extraction des codes romes erronés
  if (formations?.length) {
    formations = formations
      .map((formation) => {
        filterWrongRomes(formation)
        return formation
      })
      .filter((formation) => formation.rome_codes.length > 0)
  }

  return formations || []
}

type IRomesFormation = { rome_codes?: string[] | null; rncp_code?: string | null; cfd?: string | null; bcn_mefs_10?: Array<{ mef10?: string }> | null }
type IRomesFormationsIndex = { byRncp: Map<string, IRomesFormation[]>; byCfd: Map<string, IRomesFormation[]>; byMef: Map<string, IRomesFormation[]> }

const getRomesGlobaux = async ({ rncp, cfd, mef }: { rncp?: string | null; cfd?: string | null; mef?: string | null }, index?: IRomesFormationsIndex): Promise<string[]> => {
  let romes = [] as string[]

  if (index) {
    const seen = new Set<IRomesFormation>()
    if (rncp) for (const f of index.byRncp.get(rncp) ?? []) seen.add(f)
    if (cfd) for (const f of index.byCfd.get(cfd) ?? []) seen.add(f)
    if (mef) for (const f of index.byMef.get(mef) ?? []) seen.add(f)
    const matching = [...seen].slice(0, 5)
    if (matching.length) {
      romes = [...new Set(matching.flatMap(({ rome_codes }) => rome_codes ?? []))] as string[]
    }
    return romes
  }

  const tmpFormations = await getDbCollection("formationcatalogues")
    .find(
      {
        $or: [{ rncp_code: rncp }, { cfd: cfd ? cfd : undefined }, { "bcn_mefs_10.mef10": mef }],
      },
      { projection: { rome_codes: 1, _id: 0 } }
    )
    .limit(5)
    .toArray()
  if (tmpFormations.length) {
    romes = [...new Set(tmpFormations.flatMap(({ rome_codes }) => rome_codes))] as string[]
  }
  return romes
}

const getPrdvLink = async (wish: IWish, eligibleCles?: Set<string>): Promise<string> => {
  if (!wish.cle_ministere_educatif) {
    return ""
  }

  const utmParams = wish.utm_data ? wish.utm_data : defaultUtmData

  const isEligible = eligibleCles
    ? eligibleCles.has(wish.cle_ministere_educatif)
    : Boolean(
        await getDbCollection("eligible_trainings_for_appointments").findOne(
          {
            cle_ministere_educatif: wish.cle_ministere_educatif,
            lieu_formation_email: { $ne: null, $exists: true, $not: /^$/ },
          },
          { projection: { _id: 1 } }
        )
      )

  if (isEligible) {
    return buildEmploiUrl({
      baseUrl: `${config.publicUrl}/rdva`,
      params: { referrer: "lba", cleMinistereEducatif: wish.cle_ministere_educatif, ...utmParams },
    })
  }

  return ""
}

async function getWishCommune(wish: IWish): Promise<IReferentielCommune | null> {
  if (wish.code_insee) {
    const commune = await getCommuneByCodeInsee(wish.code_insee)
    if (commune) return commune
  }

  if (wish.code_postal) {
    const commune = await getCommuneByCodePostal(wish.code_postal)
    if (commune) return commune
  }

  const code = wish.code_insee || wish.code_postal

  if (code) {
    const generalPostCode = code.replace(/\d{3}$/, "000")
    const byCodeInsee = await getCommuneByCodeInsee(generalPostCode)
    if (byCodeInsee) return byCodeInsee
    const byCodePostal = await getCommuneByCodePostal(generalPostCode)
    if (byCodePostal) return byCodePostal
  }

  return null
}

export const getLBALink = async (wish: IWish, formationsByCle?: Map<string, IFormationCatalogue[]>, romesIndex?: IRomesFormationsIndex): Promise<string> => {
  // Try getting formations first
  const formations = await getTrainingsFromParameters(wish, formationsByCle)

  const utmParams = wish.utm_data ? wish.utm_data : defaultUtmData

  // Handle single formation case
  if (formations?.length === 1) {
    const { rome_codes, lieu_formation_geo_coordonnees } = formations[0]
    const [latitude, longitude] = lieu_formation_geo_coordonnees!.split(",")
    const romes = await expandRomesV3toV4(rome_codes ?? [])
    return buildEmploiUrl({ params: { romes, lat: latitude, lon: longitude, radius: "60", ...utmParams } })
  }

  // Extract postcode and get coordinates if available
  const commune = await getWishCommune(wish)
  // GeoJSON coordinates are in [longitude, latitude] format
  const wLon: string | null = commune?.centre.coordinates[0].toString() ?? null
  const wLat: string | null = commune?.centre.coordinates[1].toString() ?? null

  // Get romes based on rncp or training database
  let romes = wish.rncp
    ? (await getRomesFromRncp(wish.rncp)) || (await getRomesGlobaux({ rncp: wish.rncp, cfd: wish.cfd, mef: wish.mef }, romesIndex))
    : await getRomesGlobaux({ rncp: wish.rncp, cfd: wish.cfd, mef: wish.mef }, romesIndex)

  romes = romes.filter((rome_code) => rome_code.length === 5 && !rome_code.endsWith("00"))
  romes = await expandRomesV3toV4(romes)

  // Build url based on formations and coordinates
  if (formations?.length) {
    let formation = formations[0]
    let lat: string | null = null
    let lon: string | null = null
    if (formations.length > 1 && wLat && wLon) {
      // Find closest formation if multiple and coordinates available
      formation = formations.reduce(
        (closest, current) => {
          if (!current.lieu_formation_geo_coordonnees) return closest
          const [fLat, fLon] = current.lieu_formation_geo_coordonnees.split(",")
          const currentDist = getDistance({ latitude: wLat, longitude: wLon }, { latitude: fLat, longitude: fLon })
          return currentDist < closest.distance! ? { ...current, distance: currentDist } : closest
        },
        { distance: 999999999, ...formation }
      )
      // Catalogue geo-coordinates are in [latitude, longitude] format
      lat = formation.lieu_formation_geo_coordonnees?.split(",")[0] ?? null
      lon = formation.lieu_formation_geo_coordonnees?.split(",")[1] ?? null
    } else {
      // Use formation coordinates or user coordinates
      lat = formation.lieu_formation_geo_coordonnees?.split(",")[0] || wLat
      lon = formation.lieu_formation_geo_coordonnees?.split(",")[1] || wLon
    }
    return buildEmploiUrl({ params: { ...(romes.length ? { romes } : {}), lat, lon, radius: "60", ...utmParams } })
  } else {
    // No formations found, use user coordinates if available
    if (romes.length) {
      return buildEmploiUrl({ params: { romes, lat: wLat, lon: wLon, radius: "60", ...utmParams } })
    } else {
      return buildEmploiUrl({ baseUrl: config.publicUrl, params: { ...utmParams } })
    }
  }
}

export const getTrainingLinks = async (params: IWish[]): Promise<ILinks[]> => {
  const cles = [...new Set(params.map((w) => w.cle_ministere_educatif).filter(Boolean) as string[])]
  const allRncps = [...new Set(params.map((w) => w.rncp).filter(Boolean) as string[])]
  const allCfds = [...new Set(params.map((w) => w.cfd).filter(Boolean) as string[])]
  const allMefs = [...new Set(params.map((w) => w.mef).filter(Boolean) as string[])]
  const hasRomesQuery = allRncps.length || allCfds.length || allMefs.length

  const [eligibleTrainings, allFormations, romesFormations] = await Promise.all([
    cles.length
      ? getDbCollection("eligible_trainings_for_appointments")
          .find({ cle_ministere_educatif: { $in: cles }, lieu_formation_email: { $ne: null, $exists: true, $not: /^$/ } }, { projection: { _id: 0, cle_ministere_educatif: 1 } })
          .toArray()
      : Promise.resolve([]),
    cles.length
      ? getDbCollection("formationcatalogues")
          .find({ cle_ministere_educatif: { $in: cles } }, { projection: { lieu_formation_geo_coordonnees: 1, rome_codes: 1, cle_ministere_educatif: 1, _id: 0 } })
          .toArray()
      : Promise.resolve([]),
    hasRomesQuery
      ? (getDbCollection("formationcatalogues")
          .find(
            {
              $or: [
                ...(allRncps.length ? [{ rncp_code: { $in: allRncps } }] : []),
                ...(allCfds.length ? [{ cfd: { $in: allCfds } }] : []),
                ...(allMefs.length ? [{ "bcn_mefs_10.mef10": { $in: allMefs } }] : []),
              ],
            },
            { projection: { rome_codes: 1, rncp_code: 1, cfd: 1, "bcn_mefs_10.mef10": 1, _id: 0 } }
          )
          .limit(500)
          .toArray() as Promise<IRomesFormation[]>)
      : Promise.resolve([] as IRomesFormation[]),
  ])

  const eligibleCles = new Set(eligibleTrainings.map((f) => f.cle_ministere_educatif as string))

  const formationsByCle = new Map<string, IFormationCatalogue[]>()
  for (const formation of allFormations) {
    const cle = formation.cle_ministere_educatif as string
    if (!formationsByCle.has(cle)) formationsByCle.set(cle, [])
    formationsByCle.get(cle)!.push(formation)
  }

  const romesIndex: IRomesFormationsIndex = { byRncp: new Map(), byCfd: new Map(), byMef: new Map() }
  for (const f of romesFormations) {
    if (f.rncp_code) {
      if (!romesIndex.byRncp.has(f.rncp_code)) romesIndex.byRncp.set(f.rncp_code, [])
      romesIndex.byRncp.get(f.rncp_code)!.push(f)
    }
    if (f.cfd) {
      if (!romesIndex.byCfd.has(f.cfd)) romesIndex.byCfd.set(f.cfd, [])
      romesIndex.byCfd.get(f.cfd)!.push(f)
    }
    for (const { mef10 } of f.bcn_mefs_10 ?? []) {
      if (mef10) {
        if (!romesIndex.byMef.has(mef10)) romesIndex.byMef.set(mef10, [])
        romesIndex.byMef.get(mef10)!.push(f)
      }
    }
  }

  const results: ILinks[] = []
  await asyncForEach(params, async (training) => {
    const [lien_prdv, lien_lba] = await Promise.all([getPrdvLink(training, eligibleCles), getLBALink(training, formationsByCle, romesIndex)])
    results.push({ id: training.id, lien_prdv, lien_lba })
  })

  return results
}
