import dayjs from "shared/helpers/dayjs"
import { logger } from "@/common/logger"
import { notifyToSlack } from "@/common/utils/slackUtils"
import config from "@/config"
import mailer from "@/services/mailer.service"
import { createRdvaPremiumParcoursupPageLink } from "@/services/appLinks.service"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { isValidEmail } from "@/common/utils/isValidEmail"
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

export const inviteEtablissementParcoursupToPremiumBypassDate = async () => {
  await inviteEtablissementParcoursupToPremium(true)
}

export const inviteEtablissementParcoursupToPremium = async (bypassDate: boolean = false) => {
  logger.info("Cron #inviteEtablissementToPremium started.")

  if (!bypassDate) {
    const { startDay, startMonth } = config.parcoursupPeriods.start
    const { endDay, endMonth } = config.parcoursupPeriods.end

    const startInvitationPeriod = dayjs().month(startMonth).date(startDay)
    const endInvitationPeriod = dayjs().month(endMonth).date(endDay)
    if (!dayjs().isBetween(startInvitationPeriod, endInvitationPeriod, "day", "[]")) {
      logger.info("Stopped because we are not within the eligible period.")
      return
    }
  }

  const etablissementsToInviteToPremium: Array<IEtablissementsToInviteToPremium> = (await getDbCollection("etablissements")
    .aggregate([
      {
        $match: {
          gestionnaire_email: {
            $ne: null,
          },
          premium_activation_date: null,
          premium_invitation_date: null,
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

  let count = 0

  logger.info("Cron #inviteEtablissementToPremium / Etablissement: ", etablissementsToInviteToPremium.length)

  for (const etablissement of etablissementsToInviteToPremium) {
    // Only send an invite if the "etablissement" have at least one available Parcoursup "formation"
    const hasOneAvailableFormation = await getDbCollection("eligible_trainings_for_appointments").findOne({
      etablissement_gestionnaire_siret: etablissement._id.gestionnaire_siret,
      lieu_formation_email: { $ne: null },
      parcoursup_visible: true,
    })

    if (!hasOneAvailableFormation || !isValidEmail(etablissement.gestionnaire_email) || !etablissement._id.gestionnaire_siret || !etablissement.gestionnaire_email) {
      continue
    }

    count++

    // Invite all etablissements only in production environment
    const emailEtablissement = await mailer.sendEmail({
      to: etablissement.gestionnaire_email,
      subject: `Trouvez et recrutez vos candidats sur Parcoursup !`,
      template: getStaticFilePath("./templates/mail-cfa-premium-invite.mjml.ejs"),
      data: {
        isParcoursup: true,
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
          optoutCfa: `${config.publicUrl}/images/emails/optout_cfa.png?raw=true`,
          logoParcoursup: `${config.publicUrl}/images/emails/logo_parcoursup.png`,
        },
        etablissement: {
          email: etablissement.gestionnaire_email,
          activatedAt: dayjs(etablissement.optout_activation_scheduled_date).format("DD/MM/YYYY"),
          linkToForm: createRdvaPremiumParcoursupPageLink(etablissement.gestionnaire_email, etablissement._id.gestionnaire_siret, etablissement.id.toString()),
          name: hasOneAvailableFormation.etablissement_formateur_raison_sociale,
          formateur_address: hasOneAvailableFormation.lieu_formation_street,
          formateur_zip_code: hasOneAvailableFormation.lieu_formation_zip_code,
          formateur_city: hasOneAvailableFormation.lieu_formation_city,
          formateur_siret: hasOneAvailableFormation.etablissement_formateur_siret,
        },
        publicEmail: config.publicEmail,
        utmParams: "utm_source=lba&utm_medium=email&utm_campaign=lba_cfa_rdva-parcoursup-invitation",
      },
    })

    await getDbCollection("etablissements").updateMany(
      { gestionnaire_siret: etablissement._id.gestionnaire_siret },
      {
        $set: {
          premium_invitation_date: dayjs().toDate(),
          to_CFA_invite_optout_last_message_id: emailEtablissement.messageId,
        },
      }
    )
  }

  await notifyToSlack({ subject: "RDVA - INVITATION PARCOURSUP", message: `${count} invitation(s) envoyée(s)` })

  logger.info("Cron #inviteEtablissementToPremium done.")
}
