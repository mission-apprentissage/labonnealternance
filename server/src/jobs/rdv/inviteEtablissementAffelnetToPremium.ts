import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { createRdvaPremiumAffelnetPageLink } from "@/services/appLinks.service"

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

export const inviteEtablissementAffelnetToPremium = async () => {
  logger.info("Cron #inviteEtablissementAffelnetToPremium started.")

  const { startDay, startMonth } = config.affelnetPeriods.start
  const { endDay, endMonth } = config.affelnetPeriods.end
  let count = 0

  const startInvitationPeriod = dayjs().month(startMonth).date(startDay)
  const endInvitationPeriod = dayjs().month(endMonth).date(endDay)
  if (!dayjs().isBetween(startInvitationPeriod, endInvitationPeriod, "day", "[]")) {
    logger.info("Stopped because we are not within the eligible period.")
    return
  }

  const etablissementsToInviteToPremium: Array<IEtablissementsToInviteToPremium> = (await getDbCollection("etablissements")
    .aggregate([
      {
        $match: {
          gestionnaire_email: {
            $ne: null,
          },
          premium_affelnet_invitation_date: null,
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
    // Only send an invite if the "etablissement" have at least one available Parcoursup "formation"
    const hasOneAvailableFormation = await getDbCollection("eligible_trainings_for_appointments").findOne({
      etablissement_gestionnaire_siret: etablissement._id.gestionnaire_siret,
      lieu_formation_email: { $ne: null },
      affelnet_visible: true,
    })

    if (!hasOneAvailableFormation || !isValidEmail(etablissement.gestionnaire_email) || !etablissement._id.gestionnaire_siret || !etablissement.gestionnaire_email) {
      continue
    }

    count++

    // send the invitation mail
    const emailEtablissement = await mailer.sendEmail({
      to: etablissement.gestionnaire_email,
      subject: `Trouvez et recrutez vos candidats sur Choisir son affectation après la 3e !`,
      template: getStaticFilePath("./templates/mail-cfa-premium-invite.mjml.ejs"),
      data: {
        isAffelnet: true,
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          exempleParcoursup: `${config.publicUrl}/assets/exemple_integration_affelnet.webp?raw=true`,
        },
        etablissement: {
          email: etablissement.gestionnaire_email,
          activatedAt: dayjs(etablissement.optout_activation_scheduled_date).format("DD/MM/YYYY"),
          linkToForm: createRdvaPremiumAffelnetPageLink(etablissement.gestionnaire_email, etablissement._id.gestionnaire_siret, etablissement.id.toString()),
        },
      },
    })

    await getDbCollection("etablissements").updateMany(
      { gestionnaire_siret: etablissement._id.gestionnaire_siret },
      {
        $set: {
          premium_affelnet_invitation_date: dayjs().toDate(),
          to_CFA_invite_optout_last_message_id: emailEtablissement.messageId,
        },
      }
    )
  }

  await notifyToSlack({ subject: "RDVA - INVITATION AFFELNET", message: `${count} invitation(s) envoyée(s)` })

  logger.info("Cron #inviteEtablissementAffelnetToPremium done.")
}
