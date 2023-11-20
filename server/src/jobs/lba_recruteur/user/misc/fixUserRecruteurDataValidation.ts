import Boom from "boom"
import { ZGlobalAddress } from "shared/models"

import { logger } from "@/common/logger"
import { UserRecruteur } from "@/common/model"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { formatEntrepriseData, getEtablissementFromGouv, getGeoCoordinates } from "@/services/etablissement.service"
import { updateUser } from "@/services/userRecruteur.service"

const fixAddressDetailAcademie = async () => {
  const subject = "Fix data validations pour userrecruteurs : address_detail.academie & address_detail.l1"
  const userRecruteurs = await UserRecruteur.find({
    $or: [
      {
        "address_detail.academie": { $exists: true },
      },
      {
        "address_detail.l1": { $exists: true },
      },
    ],
    type: "ENTREPRISE",
  }).lean()
  const stats = { success: 0, failure: 0 }
  logger.info(`${subject}: ${userRecruteurs.length} user recruteurs à mettre à jour...`)
  await asyncForEach(userRecruteurs, async (userRecruiter, index) => {
    try {
      index % 100 === 0 && logger.info("index", index)
      const { address_detail, establishment_siret } = userRecruiter
      if (address_detail && ("academie" in address_detail || "l1" in address_detail) && !ZGlobalAddress.safeParse(address_detail).success) {
        if (!establishment_siret) {
          throw Boom.internal("Missing establishment_siret", { _id: userRecruiter._id })
        }
        const siretResponse = await getEtablissementFromGouv(establishment_siret)
        if (!siretResponse) {
          throw Boom.internal("Pas de réponse")
        }
        const entrepriseData = formatEntrepriseData(siretResponse.data)
        const numeroEtRue = entrepriseData.address_detail.acheminement_postal.l4
        const codePostalEtVille = entrepriseData.address_detail.acheminement_postal.l6
        const { latitude, longitude } = await getGeoCoordinates(`${numeroEtRue}, ${codePostalEtVille}`).catch(() => getGeoCoordinates(codePostalEtVille))
        const savedData = { ...entrepriseData, geo_coordinates: `${latitude},${longitude}` }
        await updateUser({ _id: userRecruiter._id }, savedData)
      }
      stats.success++
    } catch (err) {
      sentryCaptureException(err)
      stats.failure++
    }
  })
  await notifyToSlack({
    subject,
    message: `${stats.failure} erreurs. ${stats.success} mises à jour`,
    error: stats.failure > 0,
  })
  return stats
}

export const fixUserRecruiterDataValidation = async () => {
  await fixAddressDetailAcademie()
}
