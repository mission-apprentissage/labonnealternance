import { JOB_STATUS } from "shared/models/index"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { asyncForEach } from "../../common/utils/asyncUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"
import dayjs from "../../services/dayjs.service"

export const cancelOfferJob = async () => {
  const today = dayjs().startOf("day").utc(true).toDate()

  const formulaires = await getDbCollection("recruiters")
    .find({
      "jobs.job_status": JOB_STATUS.ACTIVE,
      "jobs.job_expiration_date": { $lte: today },
    })
    .toArray()

  // reduce formulaire with eligible offers
  const offersToCancel = formulaires.reduce((acc: any[], formulaire) => {
    formulaire.jobs
      // The query returns all offers included in the form, regardless of the status filter in the query.
      // The payload is smaller than not filtering it.
      .filter((x) => x.job_status === JOB_STATUS.ACTIVE)
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
    await getDbCollection("recruiters").findOneAndUpdate(
      { "jobs._id": job._id },
      { $set: { "jobs.$.job_status": JOB_STATUS.ANNULEE, updatedAt: new Date(), "jobs.$.job_update_date": new Date() } }
    )
  })

  logger.info(`${offersToCancel.length} offres expirés`)
  await notifyToSlack({ subject: "EXPIRATION OFFRE", message: `*${offersToCancel.length} offres* ont expirées et ont été annulées automatiquement` })
}
