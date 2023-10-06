import { logger } from "../../../../common/logger"
import { Recruiter } from "../../../../common/model"
import { asyncForEach, sleep } from "../../../../common/utils/asyncUtils"
import { getGeoCoordinates } from "../../../../services/etablissement.service"

export const recoverMissingGeocoordinates = async () => {
  const recruiters = await Recruiter.find({ geo_coordinates: null })

  await asyncForEach(recruiters, async (recruiter) => {
    await sleep(1000)
    const geocoord = await getGeoCoordinates(`${recruiter.address_detail.l4} ${recruiter.address_detail.l6}`)
    logger.info(`${recruiter.establishment_siret} - geocoord: ${geocoord} - adresse: ${recruiter.address_detail.l4} ${recruiter.address_detail.l6} `)
    recruiter.geo_coordinates = geocoord
    await recruiter.save()
  })
}
