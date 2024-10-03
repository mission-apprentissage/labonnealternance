import { ObjectId } from "mongodb"
import { ITrackingCookies, TrafficType } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const saveApplicationTrafficSourceIfAny = async ({ application_id, source }: { application_id: ObjectId; source?: ITrackingCookies }) =>
  saveTrafficSourceIfAny({ user_id: null, application_id, traffic_type: TrafficType.APPLICATION, source })

export const saveUserTrafficSourceIfAny = async ({ user_id, type, source }: { user_id: ObjectId; type: TrafficType; source?: ITrackingCookies }) =>
  saveTrafficSourceIfAny({ user_id, application_id: null, traffic_type: type, source })

const saveTrafficSourceIfAny = async ({
  user_id,
  application_id,
  traffic_type,
  source,
}: {
  user_id: ObjectId | null
  application_id: ObjectId | null
  traffic_type: TrafficType
  source?: ITrackingCookies
}) => {
  if (source?.referer || source?.utm_campaign) {
    await getDbCollection("traffic_sources").insertOne({
      _id: new ObjectId(),
      user_id,
      application_id,
      traffic_type,
      utm_campaign: source.utm_campaign,
      referer: source.referer,
      utm_medium: source.utm_medium,
      utm_source: source.utm_source,
    })
  }
}
