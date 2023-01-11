import { mailTemplate } from "../../assets/index.js"
import { logger } from "../../common/logger.js"
import { mailType } from "../../common/model/constants/etablissement.js"
import { dayjs } from "../../common/utils/dayjs.js"
import config from "../../config.js"
import _ from "lodash-es"

/**
 * @description Send a "Premium" reminder mail.
 * @returns {Promise<void>}
 */
export const premiumActivatedReminder = async ({ etablissements, widgetParameters, mailer }) => {
  logger.info("Cron #premiumActivatedReminder started.")

  const [etablissementsActivated, widgetParametersFound] = await Promise.all([
    etablissements
      .find({
        email_decisionnaire: {
          $ne: null,
        },
        premium_activated_at: {
          $ne: null,
        },
      })
      .lean(),
    widgetParameters.find({ id_parcoursup: { $ne: null }, email_rdv: { $ne: null } }).lean(),
  ])

  const etablissementWithParcoursup = etablissementsActivated.filter((etablissement) =>
    widgetParametersFound.find((widgetParameter) => widgetParameter.etablissement_formateur_siret === etablissement.siret_formateur)
  )

  for (const etablissement of etablissementWithParcoursup) {
    // Retrieve all emails
    let emails = widgetParametersFound
      .filter((widgetParameter) => widgetParameter.etablissement_formateur_siret === etablissement.siret_formateur)
      .map((widgetParameter) => widgetParameter.email_rdv)
      .concat([etablissement.email_decisionnaire, etablissement.etablissement_formateur_courriel])

    emails = _(emails).uniq().omitBy(_.isNil).toArray()

    for (const email of emails) {
      const { messageId } = await mailer.sendEmail({
        to: etablissement.email_decisionnaire,
        subject: `Les jeunes peuvent prendre contact avec votre CFA sur Parcoursup`,
        template: mailTemplate["mail-cfa-premium-activated-reminder"],
        data: {
          images: {
            logo: `${config.publicUrlEspacePro}/assets/logo-lba.png?raw=true`,
            logoParcoursup: `${config.publicUrlEspacePro}/assets/logo-parcoursup.png?raw=true`,
            logoFooter: `${config.publicUrlEspacePro}/assets/logo-republique-francaise.png?raw=true`,
            peopleLaptop: `${config.publicUrlEspacePro}/assets/people-laptop.png?raw=true`,
            integrationExample: `${config.publicUrlEspacePro}/assets/exemple_integration_parcoursup.jpg?raw=true`,
          },
          etablissement: {
            name: etablissement.raison_sociale,
            address: etablissement.adresse,
            postalCode: etablissement.code_postal,
            ville: etablissement.localite,
            siret: etablissement.siret_formateur,
            email: etablissement.email_decisionnaire,
            premiumActivatedDate: dayjs(etablissement.premium_activated_at).format("DD/MM/YYYY"),
            emailGestionnaire: etablissement.email_decisionnaire,
          },
          user: {
            destinataireEmail: email,
          },
        },
        from: config.email,
      })

      await etablissements.updateOne(
        { siret_formateur: etablissement.siret_formateur },
        {
          premium_invited_at: dayjs().toDate(),
          $push: {
            mailing: {
              campaign: mailType.PREMIUM_ACTIVATED_REMINDER,
              status: null,
              message_id: messageId,
              email_sent_at: dayjs().toDate(),
            },
          },
        }
      )
    }
  }

  logger.info("Cron #premiumActivatedReminder done.")
}
