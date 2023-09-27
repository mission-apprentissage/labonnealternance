import Joi from "joi"
import { differenceBy } from "lodash-es"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { logger } from "../../../common/logger"
import { Optout, UserRecruteur } from "../../../common/model/index"
import { asyncForEach } from "../../../common/utils/asyncUtils"
import { createActivationToken } from "../../../common/utils/jwtUtils"
import config from "../../../config"
import mailer from "../../../services/mailer.service"
import { runScript } from "../../scriptWrapper"

/**
 * @param {number} ms delay in millisecond
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

runScript(async () => {
  const [etablissements, users] = await Promise.all([Optout.find().lean(), UserRecruteur.find({ type: "CFA" }).lean()])

  const etablissementsToContact = differenceBy(etablissements, users, "siret")

  logger.info(`Sending optout mail to ${etablissementsToContact.length} etablissement`)

  await asyncForEach(etablissementsToContact, async (etablissement) => {
    // Filter contact that have already recieved an invitation from the contacts array
    const contact = etablissement.contacts.filter((contact) => {
      const found = etablissement.mail.find((y) => y.email === contact.email)
      if (!found) {
        return contact
      }
    })

    if (!contact.length) {
      logger.info(`Tous les contacts ont été solicité pour cet établissement : ${etablissement.siret}`)
      return
    }

    const { error, value: email } = Joi.string().email().validate(contact[0].email, { abortEarly: false })

    if (error) {
      await Optout.findByIdAndUpdate(etablissement._id, { $push: { mail: { email, messageId: "INVALIDE_EMAIL" } } })
      return
    }

    const token = createActivationToken(email, {
      payload: { email, siret: etablissement.siret },
      expiresIn: "45d",
    })

    const accessLink = `${config.publicUrl}/espace-pro/authentification/optout/verification?token=${token}`

    logger.info(`---- Sending mail for ${etablissement.siret} — ${email} ----`)

    let data

    try {
      data = await mailer.sendEmail({
        to: email,
        subject: "Vous êtes invité à rejoindre La bonne alternance",
        template: getStaticFilePath("./templates/mail-optout.mjml.ejs"),
        data: {
          images: {
            logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          },
          raison_sociale: etablissement.raison_sociale,
          url: accessLink,
        },
      })
    } catch (errror) {
      console.log(`ERROR : ${email} - ${etablissement.siret}`, "-----", error)
      return
    }

    await Optout.findByIdAndUpdate(etablissement._id, { $push: { mail: { email, messageId: data.messageId } } })
    logger.info(`${JSON.stringify(data)} — ${etablissement.siret} — ${email}`)

    await sleep(500)
  })
})
