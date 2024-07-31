import { URL } from "url"

// eslint-disable-next-line import/no-extraneous-dependencies
import { getDistance } from "geolib"
import { IFormationCatalogue } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import apiGeoAdresse from "../common/utils/apiGeoAdresse"
import { asyncForEach } from "../common/utils/asyncUtils"
import config from "../config.js"

import { getRomesFromRncp } from "./certification.service"

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
}

interface ILinks {
  id: string
  lien_prdv: string
  lien_lba: string
}

const utmData = { utm_source: "lba", utm_medium: "email", utm_campaign: "promotion-emploi-jeunes-voeux" }

const buildEmploiUrl = ({ baseUrl = `${config.publicUrl}/recherche-emploi`, params }: { baseUrl?: string; params: Record<string, string | string[]> }) => {
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

const getTrainingsFromParameters = async (wish: IWish): Promise<IFormationCatalogue[]> => {
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
    formations = await getFormations({ cle_ministere_educatif: wish.cle_ministere_educatif })
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

  return formations
}

const getRomesGlobaux = async ({ rncp, cfd, mef }) => {
  let romes = [] as string[]
  const tmpFormations = await getDbCollection("formationcatalogues")
    .find(
      {
        $or: [
          {
            rncp_code: rncp,
          },
          {
            cfd: cfd ? cfd : undefined,
          },
          {
            "bcn_mefs_10.mef10": mef,
          },
        ],
      },
      {
        projection: {
          rome_codes: 1,
          _id: 0,
        },
      }
    )
    .limit(5)
    .toArray()
  if (tmpFormations.length) {
    romes = [...new Set(tmpFormations.flatMap(({ rome_codes }) => rome_codes))] as string[]
  }
  return romes
}

const getPrdvLink = async (wish: IWish): Promise<string> => {
  if (!wish.cle_ministere_educatif) {
    return ""
  }

  const elligibleFormation = await getDbCollection("eligible_trainings_for_appointments").findOne(
    {
      cle_ministere_educatif: wish.cle_ministere_educatif,
      lieu_formation_email: {
        $ne: null,
        $exists: true,
        $not: /^$/,
      },
    },
    { projection: { _id: 1 } }
  )

  if (elligibleFormation) {
    return buildEmploiUrl({
      baseUrl: `${config.publicUrl}/espace-pro/form`,
      params: { referrer: "lba", cleMinistereEducatif: wish.cle_ministere_educatif, ...utmData },
    })
  }

  return ""
}

const getLBALink = async (wish: IWish): Promise<string> => {
  // Try getting formations first
  const formations = await getTrainingsFromParameters(wish)

  // Handle single formation case
  if (formations.length === 1) {
    const { rome_codes, lieu_formation_geo_coordonnees } = formations[0]
    const [latitude, longitude] = lieu_formation_geo_coordonnees!.split(",")
    return buildEmploiUrl({ params: { romes: rome_codes as string[], lat: latitude, lon: longitude, radius: "60", ...utmData } })
  }

  // Extract postcode and get coordinates if available
  const postCode = wish.code_insee || wish.code_postal
  let wLat, wLon
  if (postCode) {
    let responseApiAdresse = await apiGeoAdresse.search(postCode)

    if (!responseApiAdresse || !responseApiAdresse.features.length) {
      const generalPostCode = postCode.replace(/\d{3}$/, "000")
      responseApiAdresse = await apiGeoAdresse.search(generalPostCode)
    }

    if (responseApiAdresse && responseApiAdresse.features.length) {
      ;[wLon, wLat] = responseApiAdresse.features[0].geometry.coordinates
    }
  }

  // Get romes based on rncp or training database
  const romes = wish.rncp
    ? (await getRomesFromRncp(wish.rncp)) || (await getRomesGlobaux({ rncp: wish.rncp, cfd: wish.cfd, mef: wish.mef }))
    : await getRomesGlobaux({ rncp: wish.rncp, cfd: wish.cfd, mef: wish.mef })

  // Build url based on formations and coordinates
  if (formations.length) {
    let formation = formations[0]
    let lat, lon
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
      lat = formation.lieu_formation_geo_coordonnees?.split(",")[0]
      lon = formation.lieu_formation_geo_coordonnees?.split(",")[1]
    } else {
      // Use formation coordinates or user coordinates
      lat = formation.lieu_formation_geo_coordonnees?.split(",")[0] || wLat
      lon = formation.lieu_formation_geo_coordonnees?.split(",")[1] || wLon
    }
    return buildEmploiUrl({ params: { ...(romes.length ? { romes } : {}), lat, lon, radius: "60", ...utmData } })
  } else {
    // No formations found, use user coordinates if available
    if (romes.length) {
      return buildEmploiUrl({ params: { romes, lat: wLat ?? undefined, lon: wLon ?? undefined, radius: "60", ...utmData } })
    } else {
      return buildEmploiUrl({ baseUrl: config.publicUrl, params: { ...utmData } })
    }
  }
}

export const getTrainingLinks = async (params: IWish[]): Promise<ILinks[]> => {
  const results: any[] = []
  await asyncForEach(params, async (training) => {
    const [lien_prdv, lien_lba] = await Promise.all([getPrdvLink(training), getLBALink(training)])
    results.push({ id: training.id, lien_prdv, lien_lba })
  })

  return results
}
