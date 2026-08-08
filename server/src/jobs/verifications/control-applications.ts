import dayjs from "shared/helpers/dayjs"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"

export const controlApplications = async () => {
  const timestamp = dayjs().subtract(1, "hour").toDate()
  const countApplications = await getDbCollection("applications").countDocuments({ created_at: { $gte: timestamp } })
  if (countApplications === 0) {
    await notifyToSlack({ subject: "Verification des candidatures", message: "Aucune candidature prise dans la dernière heure", error: true })
  }
}
