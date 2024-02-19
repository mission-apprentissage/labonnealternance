import { CustomEmailETFA, EligibleTrainingsForAppointment } from "../../common/model"
import { asyncForEach } from "../../common/utils/asyncUtils"

export const up = async () => {
  const emailCustom = await EligibleTrainingsForAppointment.find({ is_lieu_formation_email_customized: true })
    .select({
      lieu_formation_email: 1,
      cle_ministere_educatif: 1,
      _id: 0,
    })
    .lean()

  await asyncForEach(emailCustom, async (custom) => {
    await CustomEmailETFA.create({ email: custom.lieu_formation_email, ...custom })
  })
}
