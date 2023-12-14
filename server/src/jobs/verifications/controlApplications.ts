import dayjs from "shared/helpers/dayjs"

import { Application } from "../../common/model"
import { notifyToSlack } from "../../common/utils/slackUtils"

export const controlApplications = async () => {
  const timestamp = dayjs().subtract(1, "hour").toDate()
  const countApplications = await Application.countDocuments({ created_at: { $gte: timestamp } })
  if (countApplications === 0) {
    await notifyToSlack({ subject: "Verification des candidatures", message: "Aucune candidature prise dans la dernière heure", error: true })
  }
}
