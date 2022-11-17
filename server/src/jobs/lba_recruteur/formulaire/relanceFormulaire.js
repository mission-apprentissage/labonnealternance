import axios from "axios"
import moment from "moment"
import { mailTemplate } from "../../../assets/index.js"
import { logger } from "../../../common/logger.js"
import { Formulaire, UserRecruteur } from "../../../common/model/index.js"
import { asyncForEach } from "../../../common/utils/asyncUtils.js"
import config from "../../../config.js"

export const relanceFormulaire = async (mailer, threshold) => {
  // number of days to expiration for the reminder email to be sent

  const forms = await Formulaire.find({
    $nor: [{ offres: { $exists: false } }, { offres: { $size: 0 } }],
    "offres.statut": "Active",
  }).lean()

  // reduce formulaire with eligible offers
  const format = forms.reduce((acc, formulaire) => {
    acc[formulaire._id] = { ...formulaire, offres: [] }

    formulaire.offres
      // The query returns all offers included in the form, regardless of the status filter in the query.
      // The payload is smaller than not filtering it.
      .filter((x) => x.statut === "Active")
      .forEach((offre) => {
        let remainingDays = moment(offre.date_expiration).diff(moment(), "days")

        // if the number of days to the expiration date is strictly above the threshold, do nothing
        if (remainingDays !== threshold) return

        offre.supprimer = `${config.publicUrl}/offre/${offre._id}/cancel`
        offre.pourvue = `${config.publicUrl}/offre/${offre._id}/provided`

        acc[formulaire._id].offres.push(offre)
      })
    return acc
  }, {})

  // format array and remove formulaire without offers
  const formulaireToExpire = Object.values(format).filter((x) => x.offres.length !== 0)

  if (formulaireToExpire.length === 0) {
    logger.info("Aucune offre à relancer aujourd'hui.")
    await axios.post(config.slackWebhookUrl, {
      text: `[${config.env.toUpperCase()} - JOB MATCHA - RELANCE J+${threshold}] Aucune relance à effectuer`,
    })
  }

  const nbOffres = formulaireToExpire.reduce((acc, formulaire) => (acc += formulaire.offres.length), 0)

  if (nbOffres > 0) {
    logger.info(`${nbOffres} offres relancé aujourd'hui.`)
    await axios.post(config.slackWebhookUrl, {
      text: `[${config.env.toUpperCase()} - JOB MATCHA - RELANCE J+${threshold}] *${nbOffres} offres* (${formulaireToExpire.length} formulaires) ont été relancés`,
    })
  }

  await asyncForEach(formulaireToExpire, async (formulaire) => {
    const { email, raison_sociale, nom, prenom, offres, mandataire, gestionnaire } = formulaire
    let contactCFA

    // get CFA informations if formulaire is handled by a CFA
    if (mandataire) {
      contactCFA = await UserRecruteur.findOne({ siret: gestionnaire })
    }

    await mailer.sendEmail({
      to: mandataire ? contactCFA.email : email,
      subject: "La bonne alternance - Vos offres vont expirer prochainement",
      template: mailTemplate["mail-expiration-offres"],
      data: {
        nom: mandataire ? contactCFA.nom : nom,
        prenom: mandataire ? contactCFA.prenom : prenom,
        raison_sociale,
        offres,
        threshold,
        url: `${config.publicUrl}/authentification`,
      },
    })
  })
}
