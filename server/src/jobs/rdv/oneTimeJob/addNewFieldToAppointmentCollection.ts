import { getDbCollection } from "../../../common/utils/mongodbUtils"
import { runScript } from "../../scriptWrapper"

export const addNewFieldToAppointmentCollection = async () => {
  const result = await getDbCollection("appointments").updateMany(
    {},
    {
      $set: {
        is_anonymized: false,
      },
    }
  )

  return result.upsertedCount
}

runScript(async () => await addNewFieldToAppointmentCollection())
