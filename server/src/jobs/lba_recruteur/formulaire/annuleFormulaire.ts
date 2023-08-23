import dayjs from "../../../services/dayjs.service.js"
import { logger } from "../../../common/logger.js"
import { Recruiter } from "../../../common/model/index.js"
import { asyncForEach } from "../../../common/utils/asyncUtils.js"
import { notifyToSlack } from "../../../common/utils/slackUtils.js"

export const annuleFormulaire = async () => {
  const today = dayjs().startOf("day").utc(true)

  const formulaires = await Recruiter.find({
    "jobs.job_status": "Active",
    "jobs.job_expiration_date": { $lte: today },
  }).lean()

  // reduce formulaire with eligible offers
  const offersToCancel = formulaires.reduce((acc, formulaire) => {
    formulaire.jobs
      // The query returns all offers included in the form, regardless of the status filter in the query.
      // The payload is smaller than not filtering it.
      .filter((x) => x.job_status === "Active")
      .forEach((offre) => {
        // if the expiration date is not equal or above today's date, do nothing
        if (!dayjs(offre.job_expiration_date).isSameOrBefore(today)) return
        acc.push(offre)
      })
    return acc
  }, [])

  if (!offersToCancel.length) {
    logger.info("Aucune offre à annuler.")
    await notifyToSlack({ subject: "EXPIRATION OFFRE", message: "Aucune offre à annuler" })
    return
  }

  await asyncForEach(offersToCancel, async (job) => {
    await Recruiter.findOneAndUpdate({ "jobs._id": job._id }, { $set: { "jobs.$.job_status": "Annulée" } })
  })

  logger.info(`${offersToCancel.length} offres expirés`)
  await notifyToSlack({ subject: "EXPIRATION OFFRE", message: `*${offersToCancel.length} offres* ont expirées et ont été annulées automatiquement` })
}
