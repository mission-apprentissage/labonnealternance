//@ts-nocheck
import { logger } from "../../../../common/logger"
import { Recruiter, UserRecruteur } from "../../../../common/model/index"
import { IUserRecruteur } from "../../../../common/model/schema/userRecruteur/userRecruteur.types"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { sentryCaptureException } from "../../../../common/utils/sentryUtils"
import { notifyToSlack } from "../../../../common/utils/slackUtils"
import { CFA, ENTREPRISE, ETAT_UTILISATEUR, JOB_STATUS, RECRUITER_STATUS } from "../../../../services/constant.service"
import { autoValidateCompany, getEntrepriseDataFromSiret, sendEmailConfirmationEntreprise } from "../../../../services/etablissement.service"
import { archiveFormulaire, getFormulaire, sendMailNouvelleOffre, updateFormulaire } from "../../../../services/formulaire.service"
import { deactivateUser, getUser, setUserInError, updateUser } from "../../../../services/userRecruteur.service"

const updateUserRecruteursSiretInfosInError = async () => {
  const query = {
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.ERROR] },
    $or: [{ type: CFA }, { type: ENTREPRISE }],
  }
  const userRecruteurs = await UserRecruteur.find(query).lean()
  const stats = { success: 0, failure: 0, deactivated: 0 }
  logger.info(`Correction des user recruteurs en erreur: ${userRecruteurs.length} user recruteurs à mettre à jour...`)
  await asyncForEach(userRecruteurs, async (userRecruteur) => {
    const { establishment_siret, _id, establishment_id } = userRecruteur
    try {
      const recruteur = await getFormulaire({ establishment_id })
      const { cfa_delegated_siret } = recruteur
      const siretResponse = await getEntrepriseDataFromSiret({ siret: establishment_siret, cfa_delegated_siret })
      if ("error" in siretResponse) {
        logger.warn(`Correction des recruteurs en erreur: userRecruteur id=${_id}, désactivation car création interdite, raison=${siretResponse.message}`)
        await deactivateUser(_id, siretResponse.message)
        stats.deactivated++
      } else {
        let updatedUserRecruteur: IUserRecruteur = await updateUser({ _id }, siretResponse)
        await updateFormulaire(recruteur.establishment_id, siretResponse)
        const result = await autoValidateCompany(updatedUserRecruteur)
        updatedUserRecruteur = result.userRecruteur
        await sendEmailConfirmationEntreprise(updatedUserRecruteur, recruteur)
        stats.success++
      }
    } catch (err) {
      const errorMessage = (err && "message" in err && err.message) || err
      await setUserInError(userRecruteur._id, errorMessage + "")
      logger.error(err)
      logger.error(`Correction des recruteurs en erreur: userRecruteur id=${_id}, erreur: ${errorMessage}`)
      sentryCaptureException(err)
      stats.failure++
    }
  })
  await notifyToSlack({
    subject: "Reprise des user recruteurs en erreur API SIRET",
    message: `${stats.success} user recruteurs repris avec succès. ${stats.failure} user recruteurs avec une erreur de l'API SIRET. ${stats.deactivated} user recruteurs désactivés pour non-respect des règles de création.`,
    error: stats.failure > 0,
  })
  return stats
}
const updateRecruteursSiretInfosInError = async () => {
  const recruteurs = await Recruiter.find({
    status: RECRUITER_STATUS.EN_ATTENTE_VALIDATION,
  }).lean()
  const stats = { success: 0, failure: 0, deactivated: 0 }
  logger.info(`Correction des recruteurs en erreur: ${recruteurs.length} user recruteurs à mettre à jour...`)
  await asyncForEach(recruteurs, async (recruteur) => {
    const { establishment_siret, establishment_id, _id, cfa_delegated_siret } = recruteur
    try {
      const siretResponse = await getEntrepriseDataFromSiret({ siret: establishment_siret, cfa_delegated_siret })
      if ("error" in siretResponse) {
        logger.warn(`Correction des recruteurs en erreur: recruteur id=${_id}, désactivation car création interdite, raison=${siretResponse.message}`)
        await archiveFormulaire(establishment_id)
        stats.deactivated++
      } else {
        const updatedRecruiter = await updateFormulaire(establishment_id, { ...siretResponse, status: RECRUITER_STATUS.ACTIF })
        const userRecruteurCFA = await getUser({ establishment_siret: cfa_delegated_siret, $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.VALIDE] } })
        await Promise.all(
          updatedRecruiter.jobs.flatMap((job) => {
            if (job.job_status === JOB_STATUS.ACTIVE) {
              return [sendMailNouvelleOffre(updatedRecruiter, job, userRecruteurCFA)]
            } else {
              return []
            }
          })
        )
        stats.success++
      }
    } catch (err) {
      const errorMessage = (err && "message" in err && err.message) || err
      await updateFormulaire(establishment_id, { status: RECRUITER_STATUS.EN_ATTENTE_VALIDATION })
      logger.error(err)
      logger.error(`Correction des recruteurs en erreur: recruteur id=${_id}, erreur: ${errorMessage}`)
      sentryCaptureException(err)
      stats.failure++
    }
  })
  await notifyToSlack({
    subject: "Reprise des recruteurs en erreur API SIRET",
    message: `${stats.success} recruteurs repris avec succès. ${stats.failure} recruteurs avec une erreur de l'API SIRET. ${stats.deactivated} recruteurs désactivés pour non-respect des règles de création.`,
    error: stats.failure > 0,
  })
  return stats
}

export const updateSiretInfosInError = async () => {
  const userRecruteurResult = await updateUserRecruteursSiretInfosInError()
  const recruteurResult = await updateRecruteursSiretInfosInError()
  return {
    userRecruteurResult,
    recruteurResult,
  }
}
