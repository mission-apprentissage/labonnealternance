import dayjs from "shared/helpers/dayjs"
import { logger } from "@/common/logger"
import { isValidEmail } from "@/common/utils/isValidEmail"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import mailer from "@/services/mailer.service"
import { createRdvaPremiumParcoursupPageLink } from "@/services/appLinks.service"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

interface IEtablissementsToInviteToPremium {
  _id: {
    gestionnaire_siret: string
  }
  id: string
  gestionnaire_email: string
  optout_activation_scheduled_date: string
  count: number
}

export const inviteEtablissementParcoursupToPremiumFollowUpCli = async () => {
  await inviteEtablissementParcoursupToPremiumFollowUp(true)
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
          logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
          optoutCfa: `${config.publicUrl}/images/emails/optout_cfa.png?raw=true`,
          logoParcoursup: `${config.publicUrl}/images/emails/logo_parcoursup.png`,
        },
        etablissement: {
          name: hasOneAvailableFormation.etablissement_formateur_raison_sociale,
          formateur_address: hasOneAvailableFormation.etablissement_formateur_street,
          formateur_zip_code: hasOneAvailableFormation.etablissement_formateur_zip_code,
          formateur_city: hasOneAvailableFormation.etablissement_formateur_city,
          siret: hasOneAvailableFormation.etablissement_formateur_siret,
          linkToForm: createRdvaPremiumParcoursupPageLink(etablissement.gestionnaire_email, etablissement._id.gestionnaire_siret, etablissement.id.toString()),
        },
        publicEmail: config.publicEmail,
        utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-premium-parcoursup-followup",
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
