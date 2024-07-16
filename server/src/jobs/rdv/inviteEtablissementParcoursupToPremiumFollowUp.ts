import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { createRdvaPremiumParcoursupPageLink } from "@/services/appLinks.service"

import { logger } from "../../common/logger"
import { isValidEmail } from "../../common/utils/isValidEmail"
import { notifyToSlack } from "../../common/utils/slackUtils"
import config from "../../config"
import dayjs from "../../services/dayjs.service"
import mailer from "../../services/mailer.service"

interface IEtablissementsToInviteToPremium {
  _id: {
    gestionnaire_siret: string
  }
  id: string
  gestionnaire_email: string
  optout_activation_scheduled_date: string
  count: number
}

export const inviteEtablissementParcoursupToPremiumFollowUp = async (bypassDate: boolean = false) => {
  logger.info("Cron #inviteEtablissementParcoursupToPremiumFollowUp started.")

  let count = 0
  let clause = [{ premium_invitation_date: { $ne: null } }, { premium_invitation_date: { $lte: dayjs().subtract(10, "days").toDate() } }]

  if (bypassDate) {
    clause = [{ premium_invitation_date: { $ne: null } }]
  }

  const etablissementsToInviteToPremium: Array<IEtablissementsToInviteToPremium> = (await getDbCollection("etablissements")
    .aggregate([
      {
        $match: {
          gestionnaire_email: {
            $ne: null,
          },
          premium_activation_date: null,
          premium_refusal_date: null,
          premium_follow_up_date: null,
          $and: clause,
        },
      },
      {
        $group: {
          _id: {
            gestionnaire_siret: "$gestionnaire_siret",
          },
          id: { $first: "$_id" },
          optout_activation_scheduled_date: { $first: "$optout_activation_scheduled_date" },
          gestionnaire_email: { $first: "$gestionnaire_email" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray()) as Array<IEtablissementsToInviteToPremium>

  for (const etablissement of etablissementsToInviteToPremium) {
    const hasOneAvailableFormation = await getDbCollection("eligible_trainings_for_appointments").findOne({
      etablissement_gestionnaire_siret: etablissement._id.gestionnaire_siret,
      lieu_formation_email: { $ne: null },
      parcoursup_visible: true,
    })

    if (!hasOneAvailableFormation || !etablissement.gestionnaire_email || !isValidEmail(etablissement.gestionnaire_email) || !etablissement._id.gestionnaire_siret) {
      continue
    }

    count++

    // Invite all etablissements only in production environment
    const emailEtablissement = await mailer.sendEmail({
      to: etablissement.gestionnaire_email,
      subject: `Trouvez et recrutez vos candidats sur Parcoursup`,
      template: getStaticFilePath("./templates/mail-cfa-premium-invite-followup.mjml.ejs"),
      data: {
        isParcoursup: true,
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          logoFooter: `${config.publicUrl}/assets/logo-republique-francaise.png?raw=true`,
          integrationExample: `${config.publicUrl}/assets/exemple_integration_parcoursup.jpg?raw=true`,
        },
        etablissement: {
          email: etablissement.gestionnaire_email,
          activatedAt: dayjs(etablissement.optout_activation_scheduled_date).format("DD/MM/YYYY"),
          linkToForm: createRdvaPremiumParcoursupPageLink(etablissement.gestionnaire_email, etablissement._id.gestionnaire_siret, etablissement.id.toString()),
        },
      },
    })

    await getDbCollection("etablissements").updateMany(
      { gestionnaire_siret: etablissement._id.gestionnaire_siret },
      {
        $set: {
          premium_follow_up_date: dayjs().toDate(),
          to_CFA_invite_optout_last_message_id: emailEtablissement.messageId,
        },
      }
    )
  }

  await notifyToSlack({ subject: "RDVA - INVITATION PARCOURSUP - FOLLOW UP", message: `${count} invitation(s) envoyée(s)` })

  logger.info("Cron #inviteEtablissementParcoursupToPremiumFollowUp done.")
}
