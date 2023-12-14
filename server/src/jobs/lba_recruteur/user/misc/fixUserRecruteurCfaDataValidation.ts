import Boom from "boom"
import { ZCfaReferentielData } from "shared/models"

import { logger } from "@/common/logger"
import { UserRecruteur } from "@/common/model"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { getOrganismeDeFormationDataFromSiret } from "@/services/etablissement.service"
import { updateUser } from "@/services/userRecruteur.service"

export const fixUserRecruiterCfaDataValidation = async () => {
  const subject = "Fix data validations pour les userrecruteurs CFA : address_detail"
  const userRecruteurs = await UserRecruteur.find({ type: "CFA" }).lean()
  const stats = { success: 0, failure: 0, skip: 0 }
  logger.info(`${subject}: ${userRecruteurs.length} user recruteurs à mettre à jour...`)
  await asyncForEach(userRecruteurs, async (userRecruiter, index) => {
    try {
      index % 100 === 0 && logger.info("index", index)
      const { establishment_siret, is_qualiopi, establishment_raison_sociale, address_detail, address, geo_coordinates } = userRecruiter
      if (
        !ZCfaReferentielData.pick({
          is_qualiopi: true,
          establishment_siret: true,
          establishment_raison_sociale: true,
          address_detail: true,
          address: true,
          geo_coordinates: true,
        }).safeParse({
          is_qualiopi,
          establishment_siret,
          establishment_raison_sociale,
          address_detail,
          address,
          geo_coordinates,
        }).success
      ) {
        if (!establishment_siret) {
          throw Boom.internal("Missing establishment_siret", { _id: userRecruiter._id })
        }
        const cfaData = await getOrganismeDeFormationDataFromSiret(establishment_siret, false)
        await updateUser({ _id: userRecruiter._id }, cfaData)
        stats.success++
      } else {
        stats.skip++
      }
    } catch (err) {
      logger.error(err)
      sentryCaptureException(err)
      stats.failure++
    }
  })
  await notifyToSlack({
    subject,
    message: `${stats.failure} erreurs. ${stats.success} mises à jour. ${stats.skip} ignorés.`,
    error: stats.failure > 0,
  })
  return stats
}
