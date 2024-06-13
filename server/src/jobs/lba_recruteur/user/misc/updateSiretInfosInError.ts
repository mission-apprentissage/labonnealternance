import Boom from "boom"
import { JOB_STATUS } from "shared"
import { CFA, RECRUITER_STATUS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { EntrepriseStatus, IEntrepriseStatusEvent } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../../../common/logger"
import { Cfa, Entreprise, RoleManagement, UserWithAccount } from "../../../../common/model/index"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { sentryCaptureException } from "../../../../common/utils/sentryUtils"
import { notifyToSlack } from "../../../../common/utils/slackUtils"
import { ENTREPRISE } from "../../../../services/constant.service"
import { EntrepriseData, autoValidateUserRoleOnCompany, getEntrepriseDataFromSiret, sendEmailConfirmationEntreprise } from "../../../../services/etablissement.service"
import { activateEntrepriseRecruiterForTheFirstTime, archiveFormulaire, sendMailNouvelleOffre, updateFormulaire } from "../../../../services/formulaire.service"
import { UserAndOrganization, deactivateEntreprise, setEntrepriseInError } from "../../../../services/userRecruteur.service"

const updateEntreprisesInfosInError = async () => {
  const entreprises = await Entreprise.find({
    $expr: { $in: [{ $arrayElemAt: ["$status.status", -1] }, [EntrepriseStatus.ERROR, EntrepriseStatus.A_METTRE_A_JOUR]] },
  }).lean()
  const stats = { success: 0, failure: 0, deactivated: 0 }
  logger.info(`Correction des entreprises en erreur: ${entreprises.length} entreprises à mettre à jour...`)
  await asyncForEach(entreprises, async (entreprise) => {
    const { siret, _id } = entreprise
    try {
      if (!siret) {
        throw Boom.internal("unexpected: no siret for userRecruteur of type ENTREPRISE", { id: entreprise._id })
      }
      const siretResponse = await getEntrepriseDataFromSiret({ siret, type: ENTREPRISE })
      if ("error" in siretResponse) {
        logger.warn(`Correction des recruteurs en erreur: entreprise id=${_id}, désactivation car création interdite, raison=${siretResponse.message}`)
        await deactivateEntreprise(_id, siretResponse.message)
        stats.deactivated++
      } else {
        const entrepriseData: Partial<EntrepriseData> = siretResponse
        const updatedEntreprise = await Entreprise.findOneAndUpdate({ _id }, entrepriseData, { new: true }).lean()
        if (!updatedEntreprise) {
          throw Boom.internal(`could not find and update entreprise with id=${_id}`)
        }
        const entrepriseEvent: IEntrepriseStatusEvent = {
          date: new Date(),
          reason: "reprise des données des entreprises en erreur / MAJ",
          status: EntrepriseStatus.VALIDE,
          validation_type: VALIDATION_UTILISATEUR.AUTO,
          granted_by: "",
        }
        await Entreprise.updateOne({ _id }, { $push: { status: entrepriseEvent } })
        await getDbCollection("recruiters").updateMany({ establishment_siret: siret }, { $set: { ...entrepriseData, updatedAt: new Date() } })
        if (getLastStatusEvent(entreprise.status)?.status === EntrepriseStatus.ERROR) {
          const recruiters = await getDbCollection("recruiters").find({ establishment_siret: siret }).toArray()
          const roles = await RoleManagement.find({ authorized_type: AccessEntityType.ENTREPRISE, authorized_id: updatedEntreprise._id.toString() }).lean()
          const rolesToUpdate = roles.filter((role) => getLastStatusEvent(role.status)?.status !== AccessStatus.DENIED)
          const users = await UserWithAccount.find({ _id: { $in: rolesToUpdate.map((role) => role.user_id) } }).lean()
          await asyncForEach(users, async (user) => {
            const userAndOrganization: UserAndOrganization = { user, type: ENTREPRISE, organization: updatedEntreprise }
            const result = await autoValidateUserRoleOnCompany(userAndOrganization, "reprise des entreprises en erreur")
            if (result.validated) {
              const recruiter = recruiters.find((recruiter) => recruiter.email === user.email && recruiter.establishment_siret === siret)
              if (!recruiter) {
                throw Boom.internal(`inattendu : recruiter non trouvé`, { email: user.email, siret })
              }
              await activateEntrepriseRecruiterForTheFirstTime(recruiter)
              const role = rolesToUpdate.find((role) => role.user_id.toString() === user._id.toString())
              const status = getLastStatusEvent(role?.status)?.status
              if (!status) {
                throw Boom.internal("inattendu : status du role non trouvé")
              }
              await sendEmailConfirmationEntreprise(user, recruiter, status, EntrepriseStatus.VALIDE)
            }
          })
        }
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
  const recruteurs = await getDbCollection("recruiters")
    .find({
      status: RECRUITER_STATUS.EN_ATTENTE_VALIDATION,
    })
    .toArray()
  const stats = { success: 0, failure: 0, deactivated: 0 }
  logger.info(`Correction des recruteurs en erreur: ${recruteurs.length} user recruteurs à mettre à jour...`)
  await asyncForEach(recruteurs, async (recruteur) => {
    const { establishment_siret, establishment_id, _id, cfa_delegated_siret } = recruteur
    if (!cfa_delegated_siret) {
      return
    }
    try {
      const siretResponse = await getEntrepriseDataFromSiret({ siret: establishment_siret, type: CFA })
      if ("error" in siretResponse) {
        logger.warn(`Correction des recruteurs en erreur: recruteur id=${_id}, désactivation car création interdite, raison=${siretResponse.message}`)
        await archiveFormulaire(establishment_id)
        stats.deactivated++
      } else {
        const entrepriseData: Partial<EntrepriseData> = siretResponse
        const updatedRecruiter = await updateFormulaire(establishment_id, { ...entrepriseData, status: RECRUITER_STATUS.ACTIF })
        const { managed_by } = updatedRecruiter
        if (!managed_by) {
          throw Boom.internal(`inattendu : managed_by vide`)
        }
        const managingUser = await UserWithAccount.findOne({ _id: managed_by.toString() })
        if (!managingUser) {
          throw Boom.internal(`inattendu : managingUser non trouvé pour _id=${managed_by}`)
        }
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
