import { URL } from "url"

// eslint-disable-next-line import/no-extraneous-dependencies
import { getDistance } from "geolib"
import { IFormationCatalogue } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import apiGeoAdresse from "../common/utils/apiGeoAdresse"
import { asyncForEach } from "../common/utils/asyncUtils"
import config from "../config.js"

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

/**
 * @description local function to get the formation related to the query
 * @param {Object} query
 * @param {string} filter
 * @returns {Promise<IFormationCatalogue[]>}
 */
const getFormations = (
  query: object,
  filter: object = {
    lieu_formation_geo_coordonnees: 1,
    rome_codes: 1,
    _id: 0,
  }
) => getDbCollection("formationcatalogues").find(query, filter).toArray()

/**
 * @description get formation according to the available parameters passed to the API endpoint
 * @param {object} wish wish data
 * @returns {Promise<IFormationCatalogue[]>}
 */
const getTrainingsFromParameters = async (wish: IWish): Promise<IFormationCatalogue[]> => {
  let formations
  // search by cle ME
  if (wish.cle_ministere_educatif) {
    formations = await getFormations({ cle_ministere_educatif: wish.cle_ministere_educatif })
  }

  if (!formations || !formations.length) {
    // search by uai_lieu_formation
    if (wish.uai_lieu_formation) {
      formations = await getFormations({ $or: [{ cfd: wish.cfd }, { rncp_code: wish.rncp }, { "bcn_mefs_10.mef10": wish.mef }], uai_formation: wish.uai_lieu_formation })
    }
  }

  if (!formations || !formations.length) {
    // search by uai_formateur
    if (wish.uai_formateur) {
      formations = await getFormations({ $or: [{ cfd: wish.cfd }, { rncp_code: wish.rncp }, { "bcn_mefs_10.mef10": wish.mef }], etablissement_formateur_uai: wish.uai_formateur })
    }
  }

  if (!formations || !formations.length) {
    // search by uai_formateur_responsable
    if (wish.uai_formateur_responsable) {
      formations = await getFormations({
        $or: [{ cfd: wish.cfd }, { rncp_code: wish.rncp }, { "bcn_mefs_10.mef10": wish.mef }],
        etablissement_gestionnaire_uai: wish.uai_formateur_responsable,
      })
    }
  }

  return formations
}

/**
 * @description get training booking link for a specific training
 * @param {object} wish wish data
 * @returns {Promise<string>} LBA link
 */
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

/**
 * @description get link LBA for a specific training
 * @param {object} wish wish data
 * @returns {Promise<string>} LBA link
 */
const getLBALink = async (wish: IWish): Promise<string> => {
  // get related trainings from catalogue
  const formations = await getTrainingsFromParameters(wish)

  const postCode = wish.code_insee || wish.code_postal
  let wLat, wLon
  if (postCode) {
    const responseApiAdresse = await apiGeoAdresse.search(postCode)
    if (responseApiAdresse && responseApiAdresse.features.length) {
      ;[wLon, wLat] = responseApiAdresse.features[0].geometry.coordinates
    }
  }

  if (!formations || !formations.length) {
    const romes = await getRomesGlobaux({ rncp: wish.rncp, cfd: wish.cfd, mef: wish.mef })
    return buildEmploiUrl({ params: { ...(romes.length ? { romes: romes } : {}), lat: wLat ?? undefined, lon: wLon ?? undefined, radius: "60", ...utmData } })
  }

  let [formation] = formations

  if (formations.length > 1 && wLat && wLon) {
    let distance = 999999999
    for (const [i, iFormation] of formations.entries()) {
      if (iFormation.lieu_formation_geo_coordonnees) {
        const [fLat, fLon] = iFormation.lieu_formation_geo_coordonnees.split(",")
        const fDist = getDistance({ latitude: wLat, longitude: wLon }, { latitude: fLat, longitude: fLon })
        if (fDist < distance) {
          distance = fDist
          formation = formations[i]
        }
      }
    }
  }

  let lat, lon
  if (formation.lieu_formation_geo_coordonnees) {
    ;[lat, lon] = formation.lieu_formation_geo_coordonnees.split(",")
  } else {
    ;[lat, lon] = [wLat, wLon]
  }

  if (formations.length > 1 && !postCode) {
    ;[lat, lon] = [undefined, undefined]
  }

  if (formations.length === 1) {
    if (formation.rome_codes && formation.rome_codes.length) {
      return buildEmploiUrl({ params: { romes: formation.rome_codes, lat: lat ?? undefined, lon: lon ?? undefined, radius: "60", ...utmData } })
    }
  }

  const romes = await getRomesGlobaux({ rncp: wish.rncp, cfd: wish.cfd, mef: wish.mef })

  return buildEmploiUrl({ params: { ...(romes.length ? { romes: romes } : {}), lat: lat ?? undefined, lon: lon ?? undefined, radius: "60", ...utmData } })
}

/**
 * @description get LBA links from candidat's orientation wish
 * @param {IWish[]} params wish array
 * @returns {Promise<ILinks[]>} LBA link
 */
export const getTrainingLinks = async (params: IWish[]): Promise<ILinks[]> => {
  const results: any[] = []
  await asyncForEach(params, async (training) => {
    const [lien_prdv, lien_lba] = await Promise.all([getPrdvLink(training), getLBALink(training)])
    results.push({ id: training.id, lien_prdv, lien_lba })
  })

  return results
}
