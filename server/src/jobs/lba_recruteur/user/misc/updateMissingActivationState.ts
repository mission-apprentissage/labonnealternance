import dayjs from "../../../../services/dayjs.service.js"
import { logger } from "../../../../common/logger.js"
import { UserRecruteur } from "../../../../db/index.js"
import { asyncForEach } from "../../../../common/utils/asyncUtils.js"
import { validationOrganisation } from "../../../../services/bal.service.js"
import { checkIfUserEmailIsPrivate } from "../../../../common/utils/mailUtils.js"
import {
  getMatchingEmailFromContactList,
  getMatchingDomainFromContactList,
  getAllEstablishmentFromBonneBoite,
  getAllEstablishmentFromBonneBoiteLegacy,
  getAllEstablishmentFromOpcoReferentiel,
} from "../../../../services/etablissement.service.js"
import { VALIDATION_UTILISATEUR, ETAT_UTILISATEUR, CFA } from "../../../../services/constant.service.js"
import { updateUser, updateUserValidationHistory } from "../../../../services/userRecruteur.service.js"
import { notifyToSlack } from "../../../../common/utils/slackUtils.js"
import { getFormulaire, updateOffre } from "../../../../services/formulaire.service.js"
import { mailTemplate } from "../../../../assets/index.js"
import { createMagicLinkToken } from "../../../../common/utils/jwtUtils.js"
import config from "../../../../config.js"
import mailer from "../../../../services/mailer.service.js"

const autoValidateUser = async (userId) =>
  await updateUserValidationHistory(userId, {
    validation_type: VALIDATION_UTILISATEUR.AUTO,
    user: "SERVEUR",
    status: ETAT_UTILISATEUR.VALIDE,
  })

const stat = { validated: 0, notFound: 0, total: 0 }

export const checkAwaitingCompaniesValidation = async () => {
  logger.info(`Start update missing validation state for companies...`)

  const entreprises = await UserRecruteur.find({ type: "ENTREPRISE", status: { $size: 1 }, "status.status": "EN ATTENTE DE VALIDATION" })

  let hasBeenValidated = false

  if (!entreprises.length) {
    notifyToSlack({ subject: "USER VALIDATION", message: "Aucunes entreprises à contrôler" })
    return
  }

  stat.total = entreprises.length

  logger.info(`${entreprises.length} etp à mettre à jour...`)

  await asyncForEach(entreprises, async (etp, index) => {
    const userFormulaire = await getFormulaire({ establishment_id: etp.establishment_id })

    if (!userFormulaire) {
      await UserRecruteur.findByIdAndDelete(etp.establishment_id)
      return
    }

    // Extract SIREN from SIRET
    const siren = etp.establishment_siret.substr(0, 9)

    // Get all matching entries from internal dictionnaires
    const [bonneBoiteLegacyList, bonneBoiteList, referentielOpcoList] = await Promise.all([
      getAllEstablishmentFromBonneBoiteLegacy({ siret: { $regex: siren }, email: { $nin: ["", undefined] } }),
      getAllEstablishmentFromBonneBoite({ siret: { $regex: siren }, email: { $nin: ["", undefined] } }),
      getAllEstablishmentFromOpcoReferentiel({ siret_code: { $regex: siren } }),
    ])

    // Tranform into single array of emails
    const [bonneBoiteLegacyEmailList, bonneBoiteEmailList, referentielOpcoEmailList] = await Promise.all([
      bonneBoiteLegacyList.map(({ email }) => email),
      bonneBoiteList.map(({ email }) => email),
      referentielOpcoList.reduce((acc: string[], item) => {
        item.emails.map((x) => acc.push(x))
        return acc
      }, []),
    ])

    // Create a single array with all emails duplicate free
    const emailListUnique = [...new Set([...referentielOpcoEmailList, ...bonneBoiteLegacyEmailList, ...bonneBoiteEmailList])]

    // Check BAL API for validation
    const balControl = await validationOrganisation(etp.establishment_siret, etp.email)

    // Control based on data available
    if (balControl.is_valid) {
      await autoValidateUser(etp._id)
      stat.validated++
      hasBeenValidated = true
    } else {
      if (emailListUnique.length) {
        if (getMatchingEmailFromContactList(etp.email, emailListUnique)) {
          await autoValidateUser(etp._id)
          stat.validated++
          hasBeenValidated = true
        } else if (checkIfUserEmailIsPrivate(etp.email) && getMatchingDomainFromContactList(etp.email, emailListUnique)) {
          await autoValidateUser(etp._id)
          stat.validated++
          hasBeenValidated = true
        } else {
          hasBeenValidated = false
          stat.notFound++
        }
      } else {
        hasBeenValidated = false
        stat.notFound++
      }
    }

    if (hasBeenValidated) {
      // Get job and update it's expiration date
      const job = Object.assign(userFormulaire.jobs[0], { job_status: "Active", job_expiration_date: dayjs().add(1, "month").format("YYYY-MM-DD") })
      // save job
      await updateOffre(job._id, job)

      // Send delegation if any
      if (job?.delegations && job?.delegations.length) {
        await Promise.all(
          job.delegations.map(
            async (delegation) =>
              await mailer.sendEmail({
                to: delegation.email,
                subject: `Une entreprise recrute dans votre domaine`,
                template: mailTemplate["mail-cfa-delegation"],
                data: {
                  images: {
                    logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
                  },
                  enterpriseName: userFormulaire.establishment_raison_sociale,
                  jobName: job.rome_appellation_label,
                  contractType: job.job_type.join(", "),
                  trainingLevel: job.job_level_label,
                  startDate: dayjs(job.job_start_date).format("DD/MM/YYYY"),
                  duration: job.job_duration,
                  rhythm: job.job_rythm,
                  offerButton: `${config.publicUrlEspacePro}/proposition/formulaire/${userFormulaire.establishment_id}/offre/${job._id}/siret/${delegation.siret_code}`,
                  createAccountButton: `${config.publicUrlEspacePro}/creation/cfa`,
                },
              })
          )
        )
      }

      // Validate user email addresse
      await updateUser({ _id: etp._id }, { is_email_checked: true })

      // Get magiclink url
      const magiclink = `${config.publicUrlEspacePro}/authentification/verification?token=${createMagicLinkToken(etp.email)}`

      const { email, last_name, first_name, establishment_raison_sociale, type } = etp

      // Send welcome email to user
      await mailer.sendEmail({
        to: email,
        subject: "Bienvenue sur La bonne alternance",
        template: mailTemplate["mail-bienvenue"],
        data: {
          images: {
            logoLba: `${config.publicUrlEspacePro}/images/logo_LBA.png?raw=true`,
          },
          last_name,
          first_name,
          establishment_raison_sociale,
          email,
          is_delegated: etp.type === CFA,
          url: magiclink,
        },
      })
    }
  })

  notifyToSlack({ subject: "USER VALIDATION", message: `${stat.validated} entreprises validées sur un total de ${stat.total} (${stat.notFound} reste à valider manuellement)` })

  logger.info(`Done.`)
  return stat
}
