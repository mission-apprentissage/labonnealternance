import { EligibleTrainingsForAppointment, FormationCatalogue } from "../common/model/index.js"
import { asyncForEach } from "../common/utils/asyncUtils.js"
import { IFormationCatalogue } from "../common/model/schema/formationCatalogue/formationCatalogue.types.js"
import apiGeoAdresse from "../common/utils/apiGeoAdresse.js"
import { URL } from "url"

const utmData = "&utm_source=lba&utm_medium=email&utm_campaign=promotion-emploi-jeunes-voeux"

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

const lbaDomain = "https://labonnealternance.apprentissage.beta.gouv.fr"
const lbaCandidat = new URL(`${lbaDomain}/recherche-emploi`)

const buildLbaLinkFromFormation = (formation: IFormationCatalogue): string => {
  const [lat, lon] = formation.lieu_formation_geo_coordonnees.split(",")
  lbaCandidat.search = `romes=${formation.rome_codes}&lat=${lat}&lon=${lon}&radius=60${utmData}`
  return lbaCandidat.toString()
}

/**
 * @description local function to get the formation related to the query
 * @param {string} query
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

  return elligibleFormation ? new URL(`${lbaDomain}/espace-pro/form?referrer=lba&cleMinistereEducatif=${encodeURIComponent(wish.cle_ministere_educatif)}${utmData}`).toString() : ""
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
    return buildLbaLinkFromFormation(formation)
  } else {
    // identify rome codes
    let romes = null
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
    }

    if (!romes?.length) {
      lbaCandidat.search = utmData
      return lbaCandidat.toString()
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

      lbaCandidat.search = `romes=${romes}${lat && lon ? `&lat=${lat}&lon=${lon}&radius=60` : ""}${utmData}`
    }

    return lbaCandidat.toString()
  }
}

/**
 * @description get LBA links from candidat's orientation wish
 * @param {IWish[]} params wish array
 * @returns {Promise<ILinks[]>} LBA link
 */
export const getTrainingLinks = async (params: IWish[]): Promise<ILinks[]> => {
  const results = []
  await asyncForEach(params, async (training) => {
    const [lien_prdv, lien_lba] = await Promise.all([getPrdvLink(training), getLBALink(training)])
    results.push({ id: training.id, lien_prdv, lien_lba })
  })

  return results
}
