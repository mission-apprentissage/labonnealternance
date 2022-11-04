import Joi from "joi";
import { differenceBy } from "lodash-es";
import { mailTemplate } from "../../../assets/index.js";
import { logger } from "../../../common/logger.js";
import { Optout, UserRecruteur } from "../../../common/model/index.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import { createActivationToken } from "../../../common/utils/jwtUtils.js";
import config from "../../../config.js";
import { runScript } from "../../scriptWrapper.js";

/**
 * @param {number} ms delay in millisecond
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

runScript(async ({ mailer }) => {
  const [etablissements, users] = await Promise.all([Optout.find().lean(), UserRecruteur.find({ type: "CFA" }).lean()]);

  const etablissementsToContact = differenceBy(etablissements, users, "siret");

  logger.info(`Sending optout mail to ${etablissementsToContact.length} etablissement`);

  await asyncForEach(etablissementsToContact, async (etablissement) => {
    // Filter contact that have already recieved an invitation from the contacts array
    const contact = etablissement.contacts.filter((contact) => {
      let found = etablissement.mail.find((y) => y.email === contact.email);
      if (!found) {
        return contact;
      }
    });

    if (!contact.length) {
      logger.info(`Tous les contacts ont été solicité pour cet établissement : ${etablissement.siret}`);
      return;
    }

    const { error, value: email } = Joi.string().email().validate(contact[0].email, { abortEarly: false });

    if (error) {
      await Optout.findByIdAndUpdate(etablissement._id, { $push: { mail: { email, messageId: "INVALIDE_EMAIL" } } });
      return;
    }

    const token = createActivationToken(email, {
      payload: { email, siret: etablissement.siret },
      expiresIn: "45d",
    });

    const accessLink = `${config.publicUrl}/authentification/optout/verification?token=${token}`;

    logger.info(`---- Sending mail for ${etablissement.siret} — ${email} ----`);

    let data;

    try {
      data = await mailer.sendEmail({
        to: email,
        subject: "Vous êtes invité à rejoindre La bonne alternance",
        template: mailTemplate["mail-optout"],
        data: {
          raison_sociale: etablissement.raison_sociale,
          url: accessLink,
        },
      });
    } catch (errror) {
      console.log(`ERROR : ${email} - ${etablissement.siret}`, "-----", error);
      return;
    }

    await Optout.findByIdAndUpdate(etablissement._id, { $push: { mail: { email, messageId: data.messageId } } });
    logger.info(`${JSON.stringify(data)} — ${etablissement.siret} — ${email}`);

    await sleep(500);
  });
});
