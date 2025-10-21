import { ObjectId } from "bson"
import { IEligibleTrainingsForAppointment } from "shared"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"

import { logger } from "../../common/logger"

/**
 * @description remove ETFA training that are not in formationcatalogues
 * @return {Promise<{ AncientElligibleTrainingCount: number, NewElligibleTrainingCount: number }>}
 */
export const eligibleTrainingsForAppointmentsHistoryWithCatalogue = async () => {
  logger.info("Cron #eligibleTrainingsForAppointmentsHistoryWithCatalogue started.")
  const now = new Date()

  const formationcataloguesCount = await getDbCollection("formationcatalogues").countDocuments()
  if (formationcataloguesCount === 0) return

  const eligibleTrainingsCollection = getDbCollection("eligible_trainings_for_appointments")
  const historyCollection = getDbCollection("eligible_trainings_for_appointments_histories")

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

  const insertOps = result.map((etfa) => ({
    ...(etfa as IEligibleTrainingsForAppointment),
    _id: new ObjectId(),
    lieu_formation_email: null,
    historization_date: now,
  }))

  await historyCollection.insertMany(insertOps)

  const deleteOps = result.map((etfa) => ({
    deleteOne: {
      filter: { cle_ministere_educatif: etfa.cle_ministere_educatif },
    },
  }))

  await eligibleTrainingsCollection.bulkWrite(deleteOps)

  await notifyToSlack({ subject: "Historisation des formations éligibles", message: `Formations historisées : ${result.length}` })

  logger.info("Cron #eligibleTrainingsForAppointmentsHistoryWithCatalogue done.")
}
