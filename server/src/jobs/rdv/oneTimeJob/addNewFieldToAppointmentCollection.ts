import { Appointment } from "../../../common/model/index"
import { runScript } from "../../scriptWrapper"

export const addNewFieldToAppointmentCollection = async () => {
  const result = await Appointment.updateMany(
    {},
    {
      $set: {
        is_anonymized: false,
      },
    }
  )

  return result.upserted
}

runScript(async () => await addNewFieldToAppointmentCollection())
