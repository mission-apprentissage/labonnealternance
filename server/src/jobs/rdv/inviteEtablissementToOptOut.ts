import { ObjectId } from "mongodb"
import dayjs from "shared/helpers/dayjs"
import { logger } from "@/common/logger"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import { createRdvaOptOutUnsubscribePageLink } from "@/services/appLinks.service"
import mailer from "@/services/mailer.service"

interface IEtablissementsWithouOptMode {
  _id: {
    gestionnaire_siret: string
  }
  id: string
  gestionnaire_email: string
  count: number
}

/**
 * @description Invite all "etablissements" without opt_mode to opt-out.
 * @returns {Promise<void>}
 */
export const inviteEtablissementToOptOut = async () => {
  logger.info("Cron #inviteEtablissementToOptOut started.")

  // Opt-out etablissement to activate
  const etablissementsWithouOptMode: Array<IEtablissementsWithouOptMode> = (await getDbCollection("etablissements")
    .aggregate([
      {
        $match: {
          optout_invitation_date: null,
          gestionnaire_email: { $ne: null },
        },
      },
      {
        $group: {
          _id: {
            gestionnaire_siret: "$gestionnaire_siret",
          },
          id: { $first: "$_id" },
          gestionnaire_email: { $first: "$gestionnaire_email" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray()) as Array<IEtablissementsWithouOptMode>
  const willBeActivatedAt = dayjs().add(15, "days")

  logger.info(`Etablissements to invite: ${etablissementsWithouOptMode.length}`)

  for (const etablissement of etablissementsWithouOptMode) {
    // Invite all etablissements only in production environment, for etablissement that have an "email_decisionnaire"

    const etablissementDetails = await getDbCollection("etablissements").findOne({
      _id: new ObjectId(etablissement.id),
    })

    if (etablissement.gestionnaire_email && etablissement._id.gestionnaire_siret && etablissementDetails) {
      const emailEtablissement = await mailer.sendEmail({
        to: etablissement.gestionnaire_email,
        subject: `Trouvez et recrutez vos candidats avec La bonne alternance`,
        template: getStaticFilePath("./templates/mail-cfa-optout-invitation.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
            logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
            optoutCfa: `${config.publicUrl}/images/emails/optout_cfa.png?raw=true`,
          },
          etablissement: {
            optOutActivatedAtDate: willBeActivatedAt.format("DD/MM/YYYY"),
            linkToUnsubscribe: createRdvaOptOutUnsubscribePageLink(etablissement.gestionnaire_email, etablissement._id.gestionnaire_siret, etablissement.id.toString()),
            name: etablissementDetails.raison_sociale,
            formateur_address: etablissementDetails.formateur_address,
            formateur_zip_code: etablissementDetails.formateur_zip_code,
            formateur_city: etablissementDetails.formateur_city,
            formateur_siret: etablissementDetails.formateur_siret,
          },
          user: {
            destinataireEmail: etablissement.gestionnaire_email,
          },
          publicEmail: config.publicEmail,
          utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-optout-invitation",
        },
      })

      await getDbCollection("etablissements").updateMany(
        { gestionnaire_siret: etablissement._id.gestionnaire_siret },
        {
          $set: {
            optout_invitation_date: dayjs().toDate(),
            optout_activation_scheduled_date: willBeActivatedAt.toDate(),
            to_CFA_invite_optout_last_message_id: emailEtablissement.messageId,
          },
        }
      )
    }
  }

  await notifyToSlack({ subject: "RDVA - INVITATION OPTOUT", message: `${etablissementsWithouOptMode.length} invitation(s) envoyée(s)` })

  logger.info("Cron #inviteEtablissementToOptOut done.")
}
