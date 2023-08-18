import { logger } from "../../../../common/logger.js"
import { UserRecruteur } from "../../../../common/model/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { notifyToSlack } from "../../../../common/utils/slackUtils.js"
import { ENTREPRISE, ETAT_UTILISATEUR } from "../../../../services/constant.service.js"
import dayjs from "../../../../services/dayjs.service.js"
import { entrepriseAutoValidationBAL } from "../../../../services/etablissement.service.js"
import { getFormulaire, sendCFADelegationMail, updateOffre } from "../../../../services/formulaire.service.js"
import { updateUser, userRecruteurSendWelcomeEmail } from "../../../../services/userRecruteur.service.js"

export const checkAwaitingCompaniesValidation = async () => {
  logger.info(`Start update missing validation state for companies...`)
  const stat = { validated: 0, notFound: 0, total: 0 }

  const entreprises = await UserRecruteur.find({ type: ENTREPRISE, status: { $size: 1 }, "status.status": ETAT_UTILISATEUR.ATTENTE })

  if (!entreprises.length) {
    notifyToSlack({ subject: "USER VALIDATION", message: "Aucunes entreprises à contrôler" })
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

    const { validated: hasBeenValidated } = await entrepriseAutoValidationBAL(entreprise)
    if (hasBeenValidated) {
      stat.validated++
    } else {
      stat.notFound++
    }

    if (hasBeenValidated) {
      // Get job and update it's expiration date
      const job = Object.assign(userFormulaire.jobs[0], { job_status: "Active", job_expiration_date: dayjs().add(1, "month").format("YYYY-MM-DD") })
      // save job
      await updateOffre(job._id, job)

      // Send delegation if any
      if (job?.delegations?.length) {
        await Promise.all(
          job.delegations.map(async (delegation) => {
            await sendCFADelegationMail(delegation.email, job, userFormulaire, delegation.siret_code)
          })
        )
      }

      // Validate user email addresse
      await updateUser({ _id: entreprise._id }, { is_email_checked: true })
      await userRecruteurSendWelcomeEmail(entreprise)
    }
  })

  notifyToSlack({ subject: "USER VALIDATION", message: `${stat.validated} entreprises validées sur un total de ${stat.total} (${stat.notFound} reste à valider manuellement)` })

  logger.info(`Done.`)
  return stat
}
