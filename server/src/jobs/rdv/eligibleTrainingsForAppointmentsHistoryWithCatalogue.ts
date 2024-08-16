import { oleoduc, writeData } from "oleoduc"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"

/**
 * @description Check if a training is still available for appointments again it's presence in the training catalogue
 * @return {void}
 */
export const eligibleTrainingsForAppointmentsHistoryWithCatalogue = async () => {
  logger.info("Cron #eligibleTrainingsForAppointmentsHistoryWithCatalogue started.")

  const control = await getDbCollection("formationcatalogues").countDocuments()

  if (control === 0) {
    return
  }

  const stats = {
    AncientElligibleTrainingCount: 0,
    NewElligibleTrainingCount: 0,
  }

  stats.AncientElligibleTrainingCount = await getDbCollection("eligible_trainings_for_appointments").countDocuments()

  await oleoduc(
    getDbCollection("eligible_trainings_for_appointments").find({}).stream(),
    writeData(
      async (formation) => {
        const exist = await getDbCollection("formationcatalogues").findOne({ cle_ministere_educatif: formation.cle_ministere_educatif })

        formation._id = undefined

        if (!exist) {
          await getDbCollection("eligible_trainings_for_appointments_histories").insertOne({ ...formation, email_rdv: undefined, historization_date: new Date() })
          await getDbCollection("eligible_trainings_for_appointments").deleteOne({ cle_ministere_educatif: formation.cle_ministere_educatif })
        }
      },
      { parallel: 20 }
    )
  )

  stats.NewElligibleTrainingCount = await getDbCollection("eligible_trainings_for_appointments").countDocuments()

  logger.info("Cron #eligibleTrainingsForAppointmentsHistoryWithCatalogue done.")

  return stats
}
