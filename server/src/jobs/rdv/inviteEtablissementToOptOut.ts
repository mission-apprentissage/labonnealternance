import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { createRdvaOptOutUnsubscribePageLink } from "@/services/appLinks.service"

import { logger } from "../../common/logger"
import { mailType } from "../../common/model/constants/etablissement"
import { Etablissement } from "../../common/model/index"
import { notifyToSlack } from "../../common/utils/slackUtils"
import config from "../../config"
import dayjs from "../../services/dayjs.service"
import mailer from "../../services/mailer.service"

/**
 * @description Invite all "etablissements" without opt_mode to opt-out.
 * @returns {Promise<void>}
 */
export const inviteEtablissementToOptOut = async () => {
  logger.info("Cron #inviteEtablissementToOptOut started.")

  // Opt-out etablissement to activate
  const etablissementsWithouOptMode = await Etablissement.find({
    optout_invitation_date: null,
    gestionnaire_email: { $ne: null },
  }).lean()
  const willBeActivatedAt = dayjs().add(15, "days")

  logger.info(`Etablissements to invite: ${etablissementsWithouOptMode.length}`)

  for (const etablissement of etablissementsWithouOptMode) {
    // Invite all etablissements only in production environment, for etablissement that have an "email_decisionnaire"
    if (etablissement.gestionnaire_email && etablissement.formateur_siret) {
      const { messageId } = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `Trouvez et recrutez vos candidats avec La bonne alternance`,
        template: getStaticFilePath("./templates/mail-cfa-optout-invitation.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
            peopleLaptop: `${config.publicUrl}/assets/people-laptop.png?raw=true`,
            optOutLbaIntegrationExample: `${config.publicUrl}/assets/exemple_integration_lba.png?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            formateur_address: etablissement.formateur_address,
            formateur_zip_code: etablissement.formateur_zip_code,
            formateur_city: etablissement.formateur_city,
            siret: etablissement?.formateur_siret,
            optOutActivatedAtDate: willBeActivatedAt.format("DD/MM/YYYY"),
            linkToUnsubscribe: createRdvaOptOutUnsubscribePageLink(etablissement.gestionnaire_email, etablissement.formateur_siret, etablissement._id.toString()),
          },
          user: {
            destinataireEmail: etablissement.gestionnaire_email,
          },
        },
      })

      await Etablissement.updateOne(
        { _id: etablissement._id },
        {
          optout_invitation_date: dayjs().toDate(),
          optout_activation_scheduled_date: willBeActivatedAt.toDate(),
          $push: {
            to_etablissement_emails: {
              campaign: mailType.OPT_OUT_INVITE,
              status: null,
              message_id: messageId,
              email_sent_at: dayjs().toDate(),
            },
          },
        }
      )
    }
  }

  notifyToSlack({ subject: "RDVA - INVITATION OPTOUT", message: `${etablissementsWithouOptMode.length} invitation(s) envoyé` })

  logger.info("Cron #inviteEtablissementToOptOut done.")
}
