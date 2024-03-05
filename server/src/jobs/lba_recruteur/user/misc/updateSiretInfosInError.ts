import Boom from "boom"
import { JOB_STATUS } from "shared"
import { RECRUITER_STATUS } from "shared/constants/recruteur"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { getUser2ManagingOffer } from "@/services/application.service"

import { logger } from "../../../../common/logger"
import { Cfa, Entreprise, Recruiter, RoleManagement, User2 } from "../../../../common/model/index"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { sentryCaptureException } from "../../../../common/utils/sentryUtils"
import { notifyToSlack } from "../../../../common/utils/slackUtils"
import { ENTREPRISE } from "../../../../services/constant.service"
import { EntrepriseData, autoValidateCompany, getEntrepriseDataFromSiret, sendEmailConfirmationEntreprise } from "../../../../services/etablissement.service"
import { activateEntrepriseRecruiterForTheFirstTime, archiveFormulaire, getFormulaire, sendMailNouvelleOffre, updateFormulaire } from "../../../../services/formulaire.service"
import { UserAndOrganization, deactivateUser, setEntrepriseInError } from "../../../../services/userRecruteur.service"

const updateEntreprisesInfosInError = async () => {
  const entreprises = await Entreprise.find({
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, EntrepriseStatus.ERROR] },
  }).lean()
  const stats = { success: 0, failure: 0, deactivated: 0 }
  logger.info(`Correction des entreprises en erreur: ${entreprises.length} entreprises à mettre à jour...`)
  await asyncForEach(entreprises, async (entreprise) => {
    const { siret: siret, _id, establishment_id } = entreprise
    try {
      if (!establishment_id || !siret) {
        throw Boom.internal("unexpected: no establishment_id and/or establishment_siret for userRecruteur of type ENTREPRISE", { id: entreprise._id })
      }
      let recruteur = await getFormulaire({ establishment_id })
      const { cfa_delegated_siret } = recruteur
      const siretResponse = await getEntrepriseDataFromSiret({ siret, cfa_delegated_siret: cfa_delegated_siret ?? undefined })
      if ("error" in siretResponse) {
        logger.warn(`Correction des recruteurs en erreur: entreprise id=${_id}, désactivation car création interdite, raison=${siretResponse.message}`)
        await deactivateUser(_id, siretResponse.message)
        stats.deactivated++
      } else {
        const entrepriseData: Partial<EntrepriseData> = siretResponse
        const updatedEntreprise = await Entreprise.findOneAndUpdate({ _id }, entrepriseData, { new: true }).lean()
        if (!updatedEntreprise) {
          throw Boom.internal(`could not find and update entreprise with id=${_id}`)
        }
        recruteur = await updateFormulaire(recruteur.establishment_id, entrepriseData)
        const roles = await RoleManagement.find({ authorized_type: AccessEntityType.ENTREPRISE, authorized_id: updatedEntreprise._id.toString() }).lean()
        const users = await User2.find({ _id: { $in: roles.map((role) => role.user_id) } }).lean()
        await Promise.all(
          users.map(async (user) => {
            const userAndOrganization: UserAndOrganization = { user, type: ENTREPRISE, organization: updatedEntreprise }
            const result = await autoValidateCompany(userAndOrganization)
            if (result.validated) {
              await activateEntrepriseRecruiterForTheFirstTime(recruteur)
              const role = roles.find((role) => role.user_id.toString() === user._id.toString())
              const status = getLastStatusEvent(role?.status)?.status
              if (!status) {
                throw Boom.internal("inattendu : status du role non trouvé")
              }
              await sendEmailConfirmationEntreprise(user, recruteur, status, EntrepriseStatus.VALIDE)
            }
          })
        )
        stats.success++
      }
    } catch (err) {
      const errorMessage = (err && typeof err === "object" && "message" in err && err.message) || err
      await setEntrepriseInError(entreprise._id, errorMessage + "")
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
  const userRecruteurResult = await updateEntreprisesInfosInError()
  const recruteurResult = await updateRecruteursSiretInfosInError()
  return {
    userRecruteurResult,
    recruteurResult,
  }
}
