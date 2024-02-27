import Boom from "boom"
import { JOB_STATUS, type IUserRecruteur } from "shared"
import { ETAT_UTILISATEUR, RECRUITER_STATUS } from "shared/constants/recruteur"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { getUser2ManagingOffer } from "@/services/application.service"

import { logger } from "../../../../common/logger"
import { Cfa, Recruiter, RoleManagement, UserRecruteur } from "../../../../common/model/index"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { sentryCaptureException } from "../../../../common/utils/sentryUtils"
import { notifyToSlack } from "../../../../common/utils/slackUtils"
import { CFA, ENTREPRISE } from "../../../../services/constant.service"
import { EntrepriseData, autoValidateCompany, getEntrepriseDataFromSiret, sendEmailConfirmationEntreprise } from "../../../../services/etablissement.service"
import { activateEntrepriseRecruiterForTheFirstTime, archiveFormulaire, getFormulaire, sendMailNouvelleOffre, updateFormulaire } from "../../../../services/formulaire.service"
import { autoValidateUser, deactivateUser, setUserInError, updateUser } from "../../../../services/userRecruteur.service"

const updateUserRecruteursSiretInfosInError = async () => {
  const userRecruteurs = await UserRecruteur.find({
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.ERROR] },
    $or: [{ type: CFA }, { type: ENTREPRISE }],
  }).lean()
  const stats = { success: 0, failure: 0, deactivated: 0 }
  logger.info(`Correction des user recruteurs en erreur: ${userRecruteurs.length} user recruteurs à mettre à jour...`)
  await asyncForEach(userRecruteurs, async (userRecruteur) => {
    const { establishment_siret, _id, establishment_id, type } = userRecruteur
    try {
      if (!establishment_id || !establishment_siret) {
        throw Boom.internal("unexpected: no establishment_id and/or establishment_siret for userRecruteur of type ENTREPRISE", { userId: userRecruteur._id })
      }
      let recruteur = await getFormulaire({ establishment_id })
      const { cfa_delegated_siret } = recruteur
      const siretResponse = await getEntrepriseDataFromSiret({ siret: establishment_siret, cfa_delegated_siret: cfa_delegated_siret ?? undefined })
      if ("error" in siretResponse) {
        logger.warn(`Correction des recruteurs en erreur: userRecruteur id=${_id}, désactivation car création interdite, raison=${siretResponse.message}`)
        await deactivateUser(_id, siretResponse.message)
        stats.deactivated++
      } else {
        const entrepriseData: Partial<EntrepriseData> = siretResponse
        let updatedUserRecruteur: IUserRecruteur = await updateUser({ _id }, entrepriseData)
        recruteur = await updateFormulaire(recruteur.establishment_id, entrepriseData)
        if (type === "ENTREPRISE") {
          const result = await autoValidateCompany(updatedUserRecruteur)
          updatedUserRecruteur = result.userRecruteur
          if (result.validated) {
            await activateEntrepriseRecruiterForTheFirstTime(recruteur)
            await sendEmailConfirmationEntreprise(updatedUserRecruteur, recruteur)
          }
        } else {
          updatedUserRecruteur = await autoValidateUser(userRecruteur._id)
        }
        stats.success++
      }
    } catch (err) {
      const errorMessage = (err && typeof err === "object" && "message" in err && err.message) || err
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
    if (!cfa_delegated_siret) {
      return
    }
    try {
      const siretResponse = await getEntrepriseDataFromSiret({ siret: establishment_siret, cfa_delegated_siret })
      if ("error" in siretResponse) {
        logger.warn(`Correction des recruteurs en erreur: recruteur id=${_id}, désactivation car création interdite, raison=${siretResponse.message}`)
        await archiveFormulaire(establishment_id)
        stats.deactivated++
      } else {
        const entrepriseData: Partial<EntrepriseData> = siretResponse
        const updatedRecruiter = await updateFormulaire(establishment_id, { ...entrepriseData, status: RECRUITER_STATUS.ACTIF })
        const managingUser = await getUser2ManagingOffer(updatedRecruiter.jobs[0])
        const cfa = await Cfa.findOne({ siret: cfa_delegated_siret }).lean()
        if (!cfa) {
          throw Boom.internal(`could not find cfa with siret=${cfa_delegated_siret}`)
        }
        const role = await RoleManagement.findOne({ user_id: managingUser._id, authorized_type: AccessEntityType.CFA, authorized_id: cfa._id.toString() }).lean()
        if (!role) {
          throw Boom.internal(`could not find role with user_id=${managingUser._id} and authorized_id=${cfa._id}`)
        }
        if (getLastStatusEvent(role.status)?.status === AccessStatus.GRANTED) {
          await Promise.all(
            updatedRecruiter.jobs.flatMap((job) => {
              if (job.job_status === JOB_STATUS.ACTIVE) {
                return [sendMailNouvelleOffre(updatedRecruiter, job, managingUser)]
              } else {
                return []
              }
            })
          )
        }
        stats.success++
      }
    } catch (err) {
      const errorMessage = (err && typeof err === "object" && "message" in err && err.message) || err
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
