import Boom from "boom"

import { logger } from "../../../../common/logger"
import { Recruiter, UserRecruteur } from "../../../../common/model/index"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { sentryCaptureException } from "../../../../common/utils/sentryUtils"
import { notifyToSlack } from "../../../../common/utils/slackUtils"
import { formatEntrepriseData, getEtablissementFromGouv } from "../../../../services/etablissement.service"
import { updateFormulaire } from "../../../../services/formulaire.service"
import { updateUser } from "../../../../services/userRecruteur.service"

const fillRecruiters = async () => {
  const recruiters = await Recruiter.find({
    establishment_raison_sociale: null,
  }).lean()
  const stats = { success: 0, failure: 0 }
  logger.info(`Remplissage des raisons sociales vides: ${recruiters.length} recruteurs à mettre à jour...`)
  await asyncForEach(recruiters, async (recruiter) => {
    const { establishment_siret, establishment_id } = recruiter
    try {
      const siretResponse = await getEtablissementFromGouv(establishment_siret)
      if (!siretResponse) {
        throw Boom.internal("Pas de réponse")
      }
      const { establishment_raison_sociale } = formatEntrepriseData(siretResponse.data)
      await updateFormulaire(establishment_id, { establishment_raison_sociale })
      stats.success++
    } catch (err) {
      sentryCaptureException(err)
      stats.failure++
    }
  })
  await notifyToSlack({
    subject: "Remplissage des raisons sociales - recruiters",
    message: `${stats.success} succès. ${stats.failure} erreurs.`,
    error: stats.failure > 0,
  })
  return stats
}

const fillUserRecruiters = async () => {
  const userRecruiters = await UserRecruteur.find({
    establishment_raison_sociale: null,
  }).lean()
  const stats = { success: 0, failure: 0 }
  logger.info(`Remplissage des raisons sociales vides: ${userRecruiters.length} user recruteurs à mettre à jour...`)
  await asyncForEach(userRecruiters, async (userRecruiter) => {
    const { establishment_siret } = userRecruiter
    try {
      const siretResponse = await getEtablissementFromGouv(establishment_siret)
      if (!siretResponse) {
        throw Boom.internal("Pas de réponse")
      }
      const { establishment_raison_sociale } = formatEntrepriseData(siretResponse.data)
      await updateUser({ _id: userRecruiter._id }, { establishment_raison_sociale })
      stats.success++
    } catch (err) {
      sentryCaptureException(err)
      stats.failure++
    }
  })
  await notifyToSlack({
    subject: "Remplissage des raisons sociales - user recruiters",
    message: `${stats.success} succès. ${stats.failure} erreurs.`,
    error: stats.failure > 0,
  })
  return stats
}

export const fillRecruiterRaisonSociale = async () => {
  await fillUserRecruiters()
  await fillRecruiters()
}
