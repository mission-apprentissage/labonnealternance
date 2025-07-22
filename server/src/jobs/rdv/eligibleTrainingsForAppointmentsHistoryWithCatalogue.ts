import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

import { logger } from "../../common/logger"

/**
 * @description Check if a training is still available for appointments again its presence in the training catalogue
 * @return {Promise<{ AncientElligibleTrainingCount: number, NewElligibleTrainingCount: number }>}
 */
export const eligibleTrainingsForAppointmentsHistoryWithCatalogue = async () => {
  logger.info("Cron #eligibleTrainingsForAppointmentsHistoryWithCatalogue started.")
  const now = new Date()

  const formationcataloguesCount = await getDbCollection("formationcatalogues").countDocuments()
  if (formationcataloguesCount === 0) return

  const eligibleTrainingsCollection = getDbCollection("eligible_trainings_for_appointments")
  const historyCollection = getDbCollection("eligible_trainings_for_appointments_histories")

  const stats = {
    AncientElligibleTrainingCount: await eligibleTrainingsCollection.countDocuments(),
    NewElligibleTrainingCount: 0,
  }

  const toHistorize = await eligibleTrainingsCollection
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
      {
        $project: {
          _id: 0,
          allFields: "$$ROOT",
        },
      },
    ])
    .toArray()

  if (toHistorize.length > 0) {
    await historyCollection.insertMany(
      toHistorize.map(({ allFields }) => ({
        ...allFields,
        lieu_formation_email: null,
        historization_date: now,
      }))
    )

    const deleteOps = toHistorize.map(({ allFields }) => ({
      deleteOne: {
        filter: { cle_ministere_educatif: allFields.cle_ministere_educatif },
      },
    }))

    await eligibleTrainingsCollection.bulkWrite(deleteOps)
  }

  stats.NewElligibleTrainingCount = await eligibleTrainingsCollection.countDocuments()

  await notifyToSlack({ subject: "Historisation des formations éligibles", message: `Formations historisées : ${toHistorize.length}` })

  logger.info("Cron #eligibleTrainingsForAppointmentsHistoryWithCatalogue done.")
}
