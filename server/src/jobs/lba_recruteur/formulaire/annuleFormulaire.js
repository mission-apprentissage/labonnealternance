import axios from "axios";
import moment from "moment";
import dayjs from "../../../common/dayjs.js";
import { logger } from "../../../common/logger.js";
import { Formulaire } from "../../../common/model/index.js";
import { asyncForEach } from "../../../common/utils/asyncUtils.js";
import config from "../../../config.js";

export const annuleFormulaire = async () => {
  const today = dayjs().startOf("day").utc(true);

  const formulaires = await Formulaire.find({
    "offres.statut": "Active",
    "offres.date_expiration": { $lte: today },
  }).lean();

  // reduce formulaire with eligible offers
  const offersToCancel = formulaires.reduce((acc, formulaire) => {
    formulaire.offres
      // The query returns all offers included in the form, regardless of the status filter in the query.
      // The payload is smaller than not filtering it.
      .filter((x) => x.statut === "Active")
      .forEach((offre) => {
        // if the expiration date is not equal or above today's date, do nothing
        if (!moment(offre.date_expiration).isSameOrBefore(today)) return;
        acc.push(offre);
      });
    return acc;
  }, []);

  if (offersToCancel.length === 0) {
    logger.info("Aucune offre à annuler.");
    await axios.post(config.slackWebhookUrl, {
      text: `[${config.env.toUpperCase()} - JOB MATCHA - EXPIRATION] Aucune offre à annuler`,
    });
    return;
  }

  const stats = {
    offersToCancel: offersToCancel.length,
    totalCanceled: 0,
  };

  await asyncForEach(offersToCancel, async (offre) => {
    await Formulaire.findOneAndUpdate({ "offres._id": offre._id }, { $set: { "offres.$.statut": "Annulée" } });
    stats.totalCanceled += 1;
  });

  if (offersToCancel.length > 0) {
    logger.info(`${stats.totalCanceled} offres expirés`);
    await axios.post(config.slackWebhookUrl, {
      text: `[${config.env.toUpperCase()} - JOB MATCHA - EXPIRATION] *${stats.offersToCancel}/${
        stats.totalCanceled
      } offres* ont expirées et ont été annulées automatiquement`,
    });
  }
};
