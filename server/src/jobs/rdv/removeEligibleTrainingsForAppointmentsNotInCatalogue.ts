import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

/**
 * @description remove ETFA training that are not in formationcatalogues
 */
export const removeEligibleTrainingsForAppointmentsNotInCatalogue = async () => {
  logger.info("Cron #removeEligibleTrainingsForAppointmentsNotInCatalogue started.")

  const formationcataloguesCount = await getDbCollection("formationcatalogues").countDocuments()
  if (formationcataloguesCount === 0) return

  const eligibleTrainingsCollection = getDbCollection("eligible_trainings_for_appointments")

  const result = await eligibleTrainingsCollection
    .aggregate([
      {
        $lookup: {
          from: "formationcatalogues",
          localField: "cle_ministere_educatif",
          foreignField: "cle_ministere_educatif",
          as: "match",
        },
      },
      {
        $match: { match: { $eq: [] } }, // Ceux qui n'ont pas de correspondance
      },
      { $unset: "match" },
    ])
    .toArray()

  if (!result.length) return

  const deleteOps = result.map((etfa) => ({
    deleteOne: {
      filter: { _id: etfa._id },
    },
  }))

  await eligibleTrainingsCollection.bulkWrite(deleteOps)

  await notifyToSlack({ subject: "Suppression des formations éligibles absentes du catalogue", message: `Formations supprimées : ${result.length}` })

  logger.info("Cron #removeEligibleTrainingsForAppointmentsNotInCatalogue done.")
}
