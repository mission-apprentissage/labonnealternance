import { internal } from "@hapi/boom"
import { ObjectId } from "mongodb"
import { IBusinessError, IRecruiter, JOB_STATUS } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { CFA, ENTREPRISE, RECRUITER_STATUS } from "shared/constants/recruteur"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { upsertEntrepriseData } from "@/services/organization.service"
import { sendDeactivatedRecruteurMail } from "@/services/roleManagement.service"
import { setEntrepriseInError } from "@/services/userRecruteur.service"

import { logger } from "../../common/logger"
import { asyncForEach } from "../../common/utils/asyncUtils"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"
import { EntrepriseData, getEntrepriseDataFromSiret } from "../../services/etablissement.service"
import { archiveFormulaire, sendMailNouvelleOffre, updateFormulaire } from "../../services/formulaire.service"

const updateEntreprisesInfosInError = async () => {
  const entreprises = await getDbCollection("entreprises")
    .find({ $expr: { $in: [{ $arrayElemAt: ["$status.status", -1] }, [EntrepriseStatus.ERROR, EntrepriseStatus.A_METTRE_A_JOUR]] } })
    .toArray()
  const stats = { success: 0, failure: 0, deactivated: 0 }
  logger.info(`Correction des entreprises en erreur: ${entreprises.length} entreprises à mettre à jour...`)
  await asyncForEach(entreprises, async (entreprise) => {
    const { siret, _id } = entreprise
    try {
      if (!siret) {
        throw internal("unexpected: no siret for entreprise", { id: entreprise._id })
      }
      const siretResponse = await getEntrepriseDataFromSiret({ siret, type: ENTREPRISE })
      await upsertEntrepriseData(siret, "script de reprise de données entreprise", siretResponse, false)
      stats.success++
    } catch (err) {
      const errorMessage = (err && typeof err === "object" && "message" in err && err.message) || err
      logger.error(err)
      logger.error(`Correction des entreprises en erreur: entreprise id=${_id}, erreur: ${errorMessage}`)
      sentryCaptureException(err)
      if (getLastStatusEvent(entreprise.status)?.status === EntrepriseStatus.ERROR) {
        await setEntrepriseInError(entreprise._id, errorMessage + "")
      }
      stats.failure++
    }
  })
  await notifyToSlack({
    subject: "Reprise des entreprises en erreur API SIRET",
    message: `${stats.success} entreprises reprises avec succès. ${stats.failure} entreprises avec une erreur de l'API SIRET.`,
    error: stats.failure > 0,
  })
  return stats
}

const deactivationWarningOriginExclusion = ["opcoep-HUBE", "opcoep-CRM"]

export const warnDeactivatedRecruteur = async (recruiter: IRecruiter, error: IBusinessError) => {
  if (!deactivationWarningOriginExclusion.includes(recruiter.origin ?? "")) {
    let errorMessage = error.message
    if (error.errorCode === BusinessErrorCodes.NON_DIFFUSIBLE) {
      errorMessage = "informations de l’entreprise non diffusibles"
    }
    if (error.errorCode === BusinessErrorCodes.IS_CFA) {
      errorMessage = "entreprise rattachée à un code NAF 85"
    }
    if (error.errorCode === BusinessErrorCodes.CLOSED) {
      errorMessage = "fermeture du compte La bonne alternance"
    }

    const { last_name, first_name, email, establishment_siret, establishment_raison_sociale, phone } = recruiter

    await sendDeactivatedRecruteurMail({ email, last_name, first_name, establishment_siret, establishment_raison_sociale, phone, errorMessage })
  }
}

const updateRecruteursSiretInfosInError = async () => {
  const recruteurs = await getDbCollection("recruiters").find({ status: RECRUITER_STATUS.EN_ATTENTE_VALIDATION }).toArray()
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
        await archiveFormulaire(recruteur)
        await warnDeactivatedRecruteur(recruteur, siretResponse)
        stats.deactivated++
      } else {
        await upsertEntrepriseData(establishment_siret, "script de reprise de données entreprise", siretResponse, false)

        const entrepriseData: Partial<EntrepriseData> = siretResponse
        const updatedRecruiter = await updateFormulaire(establishment_id, { ...entrepriseData, status: RECRUITER_STATUS.ACTIF })
        const { managed_by } = updatedRecruiter
        if (!managed_by) {
          throw internal(`inattendu : managed_by vide`)
        }
        const managingUser = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(managed_by) })
        if (!managingUser) {
          throw internal(`inattendu : managingUser non trouvé pour _id=${managed_by}`)
        }
        const cfa = await getDbCollection("cfas").findOne({ siret: cfa_delegated_siret })
        if (!cfa) {
          throw internal(`could not find cfa with siret=${cfa_delegated_siret}`)
        }
        const role = await getDbCollection("rolemanagements").findOne({ user_id: managingUser._id, authorized_type: AccessEntityType.CFA, authorized_id: cfa._id.toString() })
        if (!role) {
          throw internal(`could not find role with user_id=${managingUser._id} and authorized_id=${cfa._id}`)
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
  return { userRecruteurResult, recruteurResult }
}
