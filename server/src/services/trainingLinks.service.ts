import { URL } from "url"

import { EligibleTrainingsForAppointment, FormationCatalogue } from "../common/model/index"
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

const buildEmploiUrl = ({ baseUrl = `${config.publicUrl}/recherche-emploi`, params }: { baseUrl?: string; params: Record<string, string> }) => {
  const url = new URL(baseUrl)
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value))
  return url.toString()
}

/**
 * @description local function to get the formation related to the query
 * @param {Object} query
 * @param {string} filter
 * @returns {Promise<IFormationCatalogue>}
 */
const getFormation = (
  query: object,
  filter: object = {
    lieu_formation_geo_coordonnees: 1,
    rome_codes: 1,
    _id: 0,
  }
) => FormationCatalogue.findOne(query, filter)

/**
 * @description get formation according to the available parameters passed to the API endpoint
 * @param {object} wish wish data
 * @returns {Promise<IFormationCatalogue>}
 */
const getTrainingFromParameters = async (wish: IWish) => {
  let formation
  // search by cle ME
  if (wish.cle_ministere_educatif) {
    formation = await getFormation({ cle_ministere_educatif: wish.cle_ministere_educatif })
  }

  if (!formation) {
    // search by uai_lieu_formation
    if (wish.uai_lieu_formation) {
      formation = await getFormation({ $or: [{ cfd: wish.cfd }, { rncp_code: wish.rncp }, { "bcn_mefs_10.mef10": wish.mef }], uai_formation: wish.uai_lieu_formation })
    }
  }

  if (!formation) {
    // search by uai_formateur
    if (wish.uai_formateur) {
      formation = await getFormation({ $or: [{ cfd: wish.cfd }, { rncp_code: wish.rncp }, { "bcn_mefs_10.mef10": wish.mef }], etablissement_formateur_uai: wish.uai_formateur })
    }
  }

  if (!formation) {
    // search by uai_formateur_responsable
    if (wish.uai_formateur_responsable) {
      formation = await getFormation({
        $or: [{ cfd: wish.cfd }, { rncp_code: wish.rncp }, { "bcn_mefs_10.mef10": wish.mef }],
        etablissement_gestionnaire_uai: wish.uai_formateur_responsable,
      })
    }
  }

  return formation
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

  const elligibleFormation = await EligibleTrainingsForAppointment.findOne(
    {
      cle_ministere_educatif: wish.cle_ministere_educatif,
      lieu_formation_email: {
        $ne: null,
        $exists: true,
        $not: /^$/,
      },
    },
    { _id: 1 }
  )

  if (elligibleFormation) {
    return buildEmploiUrl({
      baseUrl: `${config.publicUrl}/espace-pro/form`,
      params: { referrer: "lba", cleMinistereEducatif: wish.cle_ministere_educatif, ...utmData },
    })
  }

  return ""
}

/**
 * @description get link LBA for a specific training
 * @param {object} wish wish data
 * @returns {Promise<string>} LBA link
 */
const getLBALink = async (wish: IWish): Promise<string> => {
  let formation

  // get related training from catalogue
  formation = await getTrainingFromParameters(wish)

  if (formation) {
    const [lat, lon] = formation.lieu_formation_geo_coordonnees.split(",")
    return buildEmploiUrl({ params: { romes: formation.rome_codes, lat, lon, radius: "60", ...utmData } })
  } else {
    // identify rome codes
    let romes
    formation = await FormationCatalogue.find(
      {
        $or: [
          {
            rncp_code: wish.rncp,
          },
          {
            cfd: wish.cfd,
          },
          {
            "bcn_mefs_10.mef10": wish.mef,
          },
        ],
      },
      {
        rome_codes: 1,
        _id: 0,
      }
    ).limit(5)

    // recover all romes codes into a single array
    if (formation.length) {
      romes = [...new Set(formation.flatMap(({ rome_codes }) => rome_codes))]
    } else {
      return buildEmploiUrl({ params: utmData })
    }

    if (!romes.length) {
      return buildEmploiUrl({ params: utmData })
    } else {
      // identify location
      let lat, lon

      if (wish.uai) {
        formation = await getFormation(
          {
            etablissement_formateur_uai: wish.uai,
          },
          {
            lieu_formation_geo_coordonnees: 1,
            _id: 0,
          }
        )

        const postCode = wish.code_insee || wish.code_postal
        if (formation) {
          ;[lat, lon] = formation.lieu_formation_geo_coordonnees.split(",")
        } else if (postCode) {
          // KBA 20230817 : might be modified using INSEE postcode.
          const responseApiAdresse = await apiGeoAdresse.searchPostcodeOnly(postCode)
          if (responseApiAdresse && responseApiAdresse.features.length) {
            ;[lon, lat] = responseApiAdresse.features[0].geometry.coordinates
          }
        }
      }

      return buildEmploiUrl({ params: { romes: romes, lat: (lat && lon) ?? undefined, lon: (lat && lon) ?? undefined, radius: "60", ...utmData } })
    }
  }
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
