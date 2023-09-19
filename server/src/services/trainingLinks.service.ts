import { URL } from "url"
import { EligibleTrainingsForAppointment, FormationCatalogue } from "../common/model/index"
import apiGeoAdresse from "../common/utils/apiGeoAdresse"
import { asyncForEach } from "../common/utils/asyncUtils"
import config from "../config.js"

interface IWish {
  id: string
  cle_ministere_educatif: string
  mef: string
  cfd: string
  rncp: string
  code_postal: string
  uai: string
  uai_lieu_formation: string
  uai_formateur: string
  uai_formateur_responsable: string
  code_insee: string
}

interface ILinks {
  id: string
  error: boolean
  message: string
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
const getTrainingFromParameters = (wish: IWish) => {
  // search by cle ME
  if (wish.cle_ministere_educatif) {
    return getFormation({ cle_ministere_educatif: wish.cle_ministere_educatif })
  }

  // search by uai_lieu_formation
  if (wish.uai_lieu_formation) {
    return getFormation({ $or: [{ cfd: wish.cfd }, { rncp_code: wish.rncp }], uai_lieu_formation: wish.uai_lieu_formation })
  }

  // search by uai_formateur
  if (wish.uai_formateur) {
    return getFormation({ $or: [{ cfd: wish.cfd }, { rncp_code: wish.rncp }], uai_formateur: wish.uai_formateur })
  }

  // search by uai_formateur_responsable
  if (wish.uai_formateur_responsable) {
    return getFormation({ $or: [{ cfd: wish.cfd }, { rncp_code: wish.rncp }], uai_formateur_responsable: wish.uai_formateur_responsable })
  }
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
      baseUrl: `${config.publicUrlEspacePro}/form`,
      params: { referrer: "lba", cleMinistereEducatif: wish.cle_ministere_educatif, ...utmData },
    })
  }
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

        if (formation) {
          ;[lat, lon] = formation.lieu_formation_geo_coordonnees.split(",")
        } else if (wish.code_postal) {
          // KBA 20230817 : might be modified using INSEE postcode.
          const responseApiAdresse = await apiGeoAdresse.searchPostcodeOnly(wish.code_postal)
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
