import { ObjectId } from "bson"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"

/**
 * @description Check if a training is still available for appointments again its presence in the training catalogue
 * @return {Promise<{ AncientElligibleTrainingCount: number, NewElligibleTrainingCount: number }>}
 */
export const eligibleTrainingsForAppointmentsHistoryWithCatalogue = async () => {
  logger.info("Cron #eligibleTrainingsForAppointmentsHistoryWithCatalogue started.")

  const control = await getDbCollection("formationcatalogues").countDocuments()
  if (control === 0) return

  const stats = {
    AncientElligibleTrainingCount: await getDbCollection("eligible_trainings_for_appointments").countDocuments(),
    NewElligibleTrainingCount: 0,
  }

  // 1. Récupère tous les `cle_ministere_educatif` valides
  const validCleMinisteres = await getDbCollection("formationcatalogues").distinct("cle_ministere_educatif")

  // 2. Récupère tous les trainings "orphelins"
  const orphanTrainings = await getDbCollection("eligible_trainings_for_appointments")
    .find({ cle_ministere_educatif: { $nin: validCleMinisteres } })
    .toArray()

  if (orphanTrainings.length > 0) {
    const now = new Date()

    await getDbCollection("eligible_trainings_for_appointments_histories").insertMany(
      orphanTrainings.map(({ _id, ...doc }) => ({
        ...doc,
        _id: new ObjectId(),
        email_rdv: undefined,
        historization_date: now,
      }))
    )

    await getDbCollection("eligible_trainings_for_appointments").deleteMany({
      cle_ministere_educatif: { $in: orphanTrainings.map((d) => d.cle_ministere_educatif) },
    })
  }

  stats.NewElligibleTrainingCount = await getDbCollection("eligible_trainings_for_appointments").countDocuments()

  logger.info("Cron #eligibleTrainingsForAppointmentsHistoryWithCatalogue done.")

  return stats
}
