import { ENTREPRISE } from "shared/constants/recruteur"

import { logger } from "../../../../common/logger"
import { Recruiter, UserRecruteur } from "../../../../common/model"
import { asyncForEach, sleep } from "../../../../common/utils/asyncUtils"
import { getGeoCoordinates } from "../../../../services/etablissement.service"

const recoverMissingGeocoordinatesUserRecruteur = async () => {
  const users = await UserRecruteur.find({ geo_coordinates: "NOT FOUND", type: ENTREPRISE })

  await asyncForEach(users, async (user) => {
    if (!user.address_detail) return
    await sleep(500)

    let geocoord
    if ("l4" in user.address_detail) {
      // if address data is in API address V2
      geocoord = await getGeoCoordinates(`${user.address_detail.l4} ${user.address_detail.l6}`)
      logger.info(`${user.establishment_siret} - geocoord: ${geocoord} - adresse: ${user.address_detail.l4} ${user.address_detail.l6} `)
    } else {
      // else API address V3
      geocoord = await getGeoCoordinates(`${user.address_detail?.acheminement_postal?.l4} ${user.address_detail?.acheminement_postal?.l6}`)
      logger.info(`${user.establishment_siret} - geocoord: ${geocoord} - adresse: ${user.address_detail?.acheminement_postal?.l4} ${user.address_detail?.acheminement_postal?.l6} `)
    }
    user.geo_coordinates = geocoord
    await user.save()
  })
}

const recoverMissingGeocoordinatesRecruiters = async () => {
  const recruiters = await Recruiter.find({ geo_coordinates: "NOT FOUND" })

  await asyncForEach(recruiters, async (recruiter) => {
    if (!recruiter.address_detail) return
    await sleep(500)

    let geocoord
    if (recruiter.address_detail.l4) {
      // if address data is in API address V2
      geocoord = await getGeoCoordinates(`${recruiter.address_detail.l4} ${recruiter.address_detail.l6}`)
    } else {
      // else API address V3
      geocoord = await getGeoCoordinates(`${recruiter.address_detail.acheminement_postal.l4} ${recruiter.address_detail.acheminement_postal.l6}`)
    }
    logger.info(
      `${recruiter.establishment_siret} - geocoord: ${geocoord} - adresse: ${recruiter.address_detail.acheminement_postal.l4} ${recruiter.address_detail.acheminement_postal.l6} `
    )
    recruiter.geo_coordinates = geocoord
    await recruiter.save()
  })
}

export const recoverMissingGeocoordinates = async () => {
  await recoverMissingGeocoordinatesRecruiters()
  await recoverMissingGeocoordinatesUserRecruteur()
}
