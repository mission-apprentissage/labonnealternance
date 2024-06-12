import dayjs from "shared/helpers/dayjs"

import { getDbCollection } from "../../common/utils/mongodbUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"

export const controlAppointments = async () => {
  const timestamp = dayjs().subtract(2, "hours").toDate()
  const countAppointments = await getDbCollection("appointments").countDocuments({ created_at: { $gte: timestamp } })
  if (countAppointments === 0) {
    await notifyToSlack({ subject: "Verification des rendez-vous", message: "Aucun rendez-vous pris depuis 2 heures", error: true })
  }
}
