import { URL } from "url"

import { EligibleTrainingsForAppointment, FormationCatalogue } from "../common/model/index"
import { IFormationCatalogue } from "../common/model/schema/formationCatalogue/formationCatalogue.types"
import apiGeoAdresse from "../common/utils/apiGeoAdresse"
import { asyncForEach } from "../common/utils/asyncUtils"

const utmData = "&utm_source=lba&utm_medium=email&utm_campaign=promotion-emploi-jeunes-voeux"

interface IWish {
  id: string
  cle_ministere_educatif: string
  mef: string
  cfd: string
  rncp: string
  code_postal: string
  uai: string
}

interface ILinks {
  id: string
  error: boolean
  message: string
  lien_prdv: string
  lien_lba: string
}

const lbaDomain = "https://labonnealternance.apprentissage.beta.gouv.fr"

const getPrdvLink = async (training: Partial<IWish>): Promise<string> => {
  if (!training.cle_ministere_educatif) {
    return ""
  } else {
    const elligibleFormation = await EligibleTrainingsForAppointment.findOne(
      {
        cle_ministere_educatif: training.cle_ministere_educatif,
        lieu_formation_email: {
          $ne: null,
          $exists: true,
          $not: /^$/,
        },
      },
      { _id: 1 }
    )
    return elligibleFormation
      ? new URL(`${lbaDomain}/espace-pro/form?referrer=lba&cleMinistereEducatif=${encodeURIComponent(training.cle_ministere_educatif)}${utmData}`).toString()
      : ""
  }
}

const getLBALink = async (training: Partial<IWish>): Promise<string> => {
  let formations

  // tentative de récupération des données à partir d'une catalogueFormation
  if (training.cle_ministere_educatif) {
    formations = await FormationCatalogue.findOne({ cle_ministere_educatif: training.cle_ministere_educatif }, { lieu_formation_geo_coordonnees: 1, rome_codes: 1, _id: 0 })
    if (formations) {
      return buildLbaLinkFromFormation(formations)
    }
  }

  // pas de formation trouvée. on utilise les autres paramètres fournis pour construire le lien lbac
  const lbaLink = new URL(`${lbaDomain}/recherche-emploi`)

  // identification des romes
  let romes = null
  formations = await FormationCatalogue.find(
    {
      $or: [
        {
          rncp_code: training.rncp,
        },
        {
          cfd: training.cfd,
        },
        {
          "bcn_mefs_10.mef10": training.mef,
        },
      ],
    },
    {
      rome_codes: 1,
      _id: 0,
    }
  ).limit(5)

  if (formations.length) {
    const romeSet = new Set()
    formations.map(({ rome_codes }) => {
      rome_codes.map((rome) => romeSet.add(rome))
    })
    romes = Array.from(romeSet)
  }

  if (!romes?.length) {
    lbaLink.search = utmData
    return lbaLink.toString()
  } else {
    // identification du lieu
    let lat = null
    let lon = null
    if (training.uai) {
      formations = await FormationCatalogue.findOne(
        {
          etablissement_formateur_uai: training.uai,
        },
        {
          lieu_formation_geo_coordonnees: 1,
          _id: 0,
        }
      )

      if (formations) {
        lat = formations.lieu_formation_geo_coordonnees.split(",")[0]
        lon = formations.lieu_formation_geo_coordonnees.split(",")[1]
      } else if (training.code_postal) {
        const responseApiAdresse = await apiGeoAdresse.searchPostcodeOnly(training.code_postal)
        if (responseApiAdresse && responseApiAdresse.features.length) {
          lat = responseApiAdresse.features[0].geometry.coordinates[1]
          lon = responseApiAdresse.features[0].geometry.coordinates[0]
        }
      }
    }

    lbaLink.search = `romes=${romes}${lat && lon ? `&lat=${lat}&lon=${lon}&radius=60` : ""}${utmData}`
  }

  return lbaLink.toString()
}

const buildLbaLinkFromFormation = (formation: IFormationCatalogue): string => {
  const latLon = formation.lieu_formation_geo_coordonnees.split(",")
  return new URL(`${lbaDomain}/recherche-emploi?&romes=${formation.rome_codes}&lat=${latLon[0]}&lon=${latLon[1]}&radius=60${utmData}`).toString()
}

/**
 * @description récupère les liens profonds vers prdv et lba pour une liste de voeux
 * @param {IWish[]} params un tableau de voeux de candidats
 * @returns {Promise<ILinks[]>}
 */
export const getTrainingLinks = async (params: IWish[]): Promise<ILinks[]> => {
  const results = []
  await asyncForEach(params, async (training) => {
    const [lien_prdv, lien_lba] = await Promise.all([getPrdvLink(training), getLBALink(training)])
    results.push({ id: training.id, lien_prdv, lien_lba })
  })
  return results
}
