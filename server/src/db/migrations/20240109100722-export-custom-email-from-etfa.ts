import { CustomEmailETFA } from "../../common/model"
import { asyncForEach } from "../../common/utils/asyncUtils"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service"

export const up = async () => {
  const emailCustom = await eligibleTrainingsForAppointmentService
    .find(
      { is_lieu_formation_email_customized: true },
      {
        projection: {
          lieu_formation_email: 1,
          cle_ministere_educatif: 1,
          _id: 0,
        },
      }
    )
    .toArray()

  await asyncForEach(emailCustom, async (custom) => {
    await CustomEmailETFA.create({ email: custom.lieu_formation_email, ...custom })
  })
}
