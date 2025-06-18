import { Transform } from "node:stream"
import { pipeline } from "node:stream/promises"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"

/**
 * @description Check if a training is still available for appointments again its presence in the training catalogue
 * @return {Promise<{ AncientElligibleTrainingCount: number, NewElligibleTrainingCount: number }>}
 */
export const eligibleTrainingsForAppointmentsHistoryWithCatalogue = async () => {
  logger.info("Cron #eligibleTrainingsForAppointmentsHistoryWithCatalogue started.")

  const control = await getDbCollection("formationcatalogues").countDocuments()
  if (control === 0) {
    return
  }

  const stats = {
    AncientElligibleTrainingCount: await getDbCollection("eligible_trainings_for_appointments").countDocuments(),
    NewElligibleTrainingCount: 0,
  }

  const transformer = new Transform({
    objectMode: true,
    async transform(formation, _, callback) {
      try {
        const exist = await getDbCollection("formationcatalogues").findOne({
          cle_ministere_educatif: formation.cle_ministere_educatif,
        })

        delete formation._id

        if (!exist) {
          await getDbCollection("eligible_trainings_for_appointments_histories").insertOne({
            ...formation,
            email_rdv: undefined,
            historization_date: new Date(),
          })

          await getDbCollection("eligible_trainings_for_appointments").deleteOne({
            cle_ministere_educatif: formation.cle_ministere_educatif,
          })
        }

        callback()
      } catch (err: any) {
        logger.error(err, "Error processing formation")
        callback(err)
      }
    },
  })

  await pipeline(getDbCollection("eligible_trainings_for_appointments").find({}).stream(), transformer)

  stats.NewElligibleTrainingCount = await getDbCollection("eligible_trainings_for_appointments").countDocuments()

  logger.info("Cron #eligibleTrainingsForAppointmentsHistoryWithCatalogue done.")

  return stats
}
