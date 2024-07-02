import { getDbCollection } from "../../common/utils/mongodbUtils"

export const up = async () => {
  await getDbCollection("appointments").updateMany({ cfa_read_appointment_details_date: { $exists: false } }, { $set: { cfa_read_appointment_details_date: null } })
}
