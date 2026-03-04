import { internal } from "@hapi/boom"
import type { IBusinessError, IEntreprise, IEntrepriseManagedByCfa, IRoleManagement, IUserWithAccount } from "shared"
import { JOB_STATUS_ENGLISH } from "shared"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { CFA, ENTREPRISE } from "shared/constants/recruteur"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { AccessStatus } from "shared/models/roleManagement.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { logger } from "@/common/logger"
import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { getEntrepriseDataFromSiret } from "@/services/etablissement.service"
import { archiveFormulaire, sendMailNouvelleOffre } from "@/services/formulaire.service"
import { upsertEntrepriseData } from "@/services/organization.service"
import { sendDeactivatedRecruteurMail } from "@/services/roleManagement.service"
import { setEntrepriseInError } from "@/services/userRecruteur.service"

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

export const warnDeactivatedRecruteur = async (user: IUserWithAccount, entreprise: IEntreprise, error: IBusinessError) => {
  if (!deactivationWarningOriginExclusion.includes(user.origin ?? "")) {
    let errorMessage = error.message
    if (error.errorCode === BusinessErrorCodes.NON_DIFFUSIBLE) {
      errorMessage = "informations de l’entreprise non diffusibles"
    }
    if (error.errorCode === BusinessErrorCodes.IS_CFA) {
      errorMessage = "entreprise rattachée à un code NAF 85"
    }

    const { last_name, first_name, email, phone } = user
    const { siret, raison_sociale } = entreprise

    await sendDeactivatedRecruteurMail({ email, last_name, first_name, establishment_siret: siret, establishment_raison_sociale: raison_sociale, phone, errorMessage })
  }
}

const updateRecruteursSiretInfosInError = async () => {
  let entreprisesManagedByCfa = (await getDbCollection("entreprise_managed_by_cfa")
    .aggregate([
      {
        $lookup: {
          from: "entreprises",
          localField: "entreprise_id",
          foreignField: "_id",
          as: "entreprise",
        },
      },
      {
        $unwind: "$entreprise",
      },
      {
        $match: {
          "entreprise.status.status": EntrepriseStatus.ERROR,
        },
      },
      {
        $lookup: {
          from: "cfas",
          localField: "cfa_id",
          foreignField: "_id",
          as: "cfa",
        },
      },
      {
        $unwind: "$cfa",
      },
      {
        $addFields: {
          cfa_id_string: { $convert: { input: "$cfa_id", to: "string" } },
        },
      },
      {
        $lookup: {
          from: "rolemanagements",
          localField: "cfa_id_string",
          foreignField: "authorized_id",
          as: "role",
        },
      },
      {
        $unwind: "$role",
      },
      {
        $lookup: {
          from: "userswithaccounts",
          localField: "role.user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ])
    .toArray()) as (IEntrepriseManagedByCfa & { entreprise: IEntreprise; role: IRoleManagement; user: IUserWithAccount })[]

  entreprisesManagedByCfa = entreprisesManagedByCfa.filter(({ entreprise }) => getLastStatusEvent(entreprise.status)?.status === EntrepriseStatus.ERROR)

  const stats = { success: 0, failure: 0, deactivated: 0 }
  logger.info(`Correction des entreprises en erreur: ${entreprisesManagedByCfa.length} à mettre à jour...`)
  await asyncForEach(entreprisesManagedByCfa, async (entrepriseManagedByCfa) => {
    const { entreprise, user, role } = entrepriseManagedByCfa
    const { siret } = entreprise
    try {
      const siretResponse = await getEntrepriseDataFromSiret({ siret, type: CFA })
      if ("error" in siretResponse) {
        logger.warn(`Correction des recruteurs en erreur: role id=${entrepriseManagedByCfa._id}, désactivation car création interdite, raison=${siretResponse.message}`)
        await archiveFormulaire(user._id, siret)

        await warnDeactivatedRecruteur(user, entreprise, siretResponse)
        stats.deactivated++
      } else {
        await upsertEntrepriseData(siret, "script de reprise de données entreprise", siretResponse, false)

        if (getLastStatusEvent(role.status)?.status === AccessStatus.GRANTED) {
          const awaitingOffer = await getDbCollection("jobs_partners").findOne({
            offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE,
            workplace_siret: siret,
            partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
            managed_by: role.user_id,
          })
          if (awaitingOffer) {
            await getDbCollection("jobs_partners").updateOne({ _id: awaitingOffer._id }, { $set: { offer_status: JOB_STATUS_ENGLISH.ACTIVE, updated_at: new Date() } })
            await sendMailNouvelleOffre(user, awaitingOffer)
          }
        }
        stats.success++
      }
    } catch (err) {
      const errorMessage = (err && typeof err === "object" && "message" in err && err.message) || err
      await getDbCollection("jobs_partners").updateMany(
        {
          workplace_siret: siret,
          partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
          managed_by: role.user_id,
        },
        {
          $set: {
            offer_status: JOB_STATUS_ENGLISH.EN_ATTENTE,
            updated_at: new Date(),
          },
        }
      )
      logger.error(err)
      logger.error(`Correction des recruteurs en erreur: role id=${entrepriseManagedByCfa._id}, erreur: ${errorMessage}`)
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
