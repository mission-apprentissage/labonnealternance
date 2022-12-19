import moment from "moment"
import dayjs from "../../../common/dayjs.js"
import { logger } from "../../../common/logger.js"
import { Formulaire } from "../../../common/model/index.js"
import { asyncForEach } from "../../../common/utils/asyncUtils.js"
import { notifyToSlack } from "../../../common/utils/slackUtils.js"

export const annuleFormulaire = async () => {
  const today = dayjs().startOf("day").utc(true)

  const formulaires = await Formulaire.find({
    "offres.statut": "Active",
    "offres.date_expiration": { $lte: today },
  }).lean()

  // reduce formulaire with eligible offers
  const offersToCancel = formulaires.reduce((acc, formulaire) => {
    formulaire.offres
      // The query returns all offers included in the form, regardless of the status filter in the query.
      // The payload is smaller than not filtering it.
      .filter((x) => x.statut === "Active")
      .forEach((offre) => {
        // if the expiration date is not equal or above today's date, do nothing
        if (!moment(offre.date_expiration).isSameOrBefore(today)) return
        acc.push(offre)
      })
    return acc
  }, [])

  if (!offersToCancel.length) {
    logger.info("Aucune offre à annuler.")
    notifyToSlack({ subject: "EXPIRATION OFFRE", message: "Aucune offre à annuler" })
    return
  }

  await asyncForEach(offersToCancel, async (offre) => {
    await Formulaire.findOneAndUpdate({ "offres._id": offre._id }, { $set: { "offres.$.statut": "Annulée" } })
  })

  logger.info(`${stats.totalCanceled} offres expirés`)
  notifyToSlack({ subject: "EXPIRATION OFFRE", message: `${offersToCancel.length} offres* ont expirées et ont été annulées automatiquement` })
}
