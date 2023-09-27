import { logger } from "../../../../common/logger"
import { UserRecruteur } from "../../../../common/model/index"
import { asyncForEach } from "../../../../common/utils/asyncUtils"
import { notifyToSlack } from "../../../../common/utils/slackUtils"
import { ENTREPRISE, ETAT_UTILISATEUR } from "../../../../services/constant.service"
import dayjs from "../../../../services/dayjs.service"
import { autoValidateCompany } from "../../../../services/etablissement.service"
import { getFormulaire, sendDelegationMailToCFA, updateOffre } from "../../../../services/formulaire.service"
import { updateUser, sendWelcomeEmailToUserRecruteur } from "../../../../services/userRecruteur.service"

export const checkAwaitingCompaniesValidation = async () => {
  logger.info(`Start update missing validation state for companies...`)
  const stat = { validated: 0, notFound: 0, total: 0 }

  const entreprises = await UserRecruteur.find({
    $expr: { $eq: [{ $arrayElemAt: ["$status.status", -1] }, ETAT_UTILISATEUR.ATTENTE] },
    type: ENTREPRISE,
  })

  if (!entreprises.length) {
    await notifyToSlack({ subject: "USER VALIDATION", message: "Aucunes entreprises à contrôler" })
    return
  }

  stat.total = entreprises.length

  logger.info(`${entreprises.length} etp à mettre à jour...`)

  await asyncForEach(entreprises, async (entreprise) => {
    const userFormulaire = await getFormulaire({ establishment_id: entreprise.establishment_id })

    if (!userFormulaire) {
      await UserRecruteur.findByIdAndDelete(entreprise.establishment_id)
      return
    }

    const { validated: hasBeenValidated } = await autoValidateCompany(entreprise)
    if (hasBeenValidated) {
      stat.validated++
    } else {
      stat.notFound++
    }

    if (hasBeenValidated) {
      // Get job and update its expiration date
      const job = Object.assign(userFormulaire.jobs[0], { job_status: "Active", job_expiration_date: dayjs().add(1, "month").format("YYYY-MM-DD") })
      // save job
      await updateOffre(job._id.toString(), job)

      // Send delegation if any
      if (job?.delegations?.length) {
        await Promise.all(
          job.delegations.map(async (delegation) => {
            await sendDelegationMailToCFA(delegation.email, job, userFormulaire, delegation.siret_code)
          })
        )
      }

      // Validate user email addresse
      await updateUser({ _id: entreprise._id }, { is_email_checked: true })
      await sendWelcomeEmailToUserRecruteur(entreprise)
    }
  })

  await notifyToSlack({
    subject: "USER VALIDATION",
    message: `${stat.validated} entreprises validées sur un total de ${stat.total} (${stat.notFound} reste à valider manuellement)`,
  })

  logger.info(`Done.`)
  return stat
}
