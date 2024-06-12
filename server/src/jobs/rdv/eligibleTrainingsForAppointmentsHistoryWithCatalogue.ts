import { oleoduc, writeData } from "oleoduc"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { logger } from "../../common/logger"
import { EligibleTrainingsForAppointment, eligibleTrainingsForAppointmentHistory } from "../../common/model/index"

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

  stats.AncientElligibleTrainingCount = await EligibleTrainingsForAppointment.countDocuments()

  await oleoduc(
    EligibleTrainingsForAppointment.find({}).lean().cursor(),
    writeData(
      async (formation) => {
        const exist = await getDbCollection("formationcatalogues").findOne({ cle_ministere_educatif: formation.cle_ministere_educatif })

        formation._id = undefined

        if (!exist) {
          await eligibleTrainingsForAppointmentHistory.create({ ...formation, email_rdv: undefined, historization_date: new Date() })
          await EligibleTrainingsForAppointment.findOneAndRemove({ cle_ministere_educatif: formation.cle_ministere_educatif })
        }
      },
      { parallel: 20 }
    )
  )

  stats.NewElligibleTrainingCount = await EligibleTrainingsForAppointment.countDocuments()

  logger.info("Cron #eligibleTrainingsForAppointmentsHistoryWithCatalogue done.")

  return stats
}
