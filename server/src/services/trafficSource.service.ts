import crypto from "crypto"

import { ObjectId } from "mongodb"
import { ITrackingCookies, TrafficType } from "shared/models"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export function hashEmail(email) {
  return crypto.createHash("sha256").update(email).digest("hex")
}

export const saveApplicationTrafficSourceIfAny = async ({
  application_id,
  applicant_email,
  source,
}: {
  application_id: ObjectId
  applicant_email: string
  source?: ITrackingCookies
}) => saveTrafficSourceIfAny({ user_id: null, application_id, applicant_email, traffic_type: TrafficType.APPLICATION, source })

export const saveUserTrafficSourceIfAny = async ({ user_id, type, source }: { user_id: ObjectId; type: TrafficType; source?: ITrackingCookies }) =>
  saveTrafficSourceIfAny({ user_id, application_id: null, applicant_email: null, traffic_type: type, source })

const saveTrafficSourceIfAny = async ({
  user_id,
  application_id,
  applicant_email,
  traffic_type,
  source,
}: {
  user_id: ObjectId | null
  application_id: ObjectId | null
  applicant_email: string | null
  traffic_type: TrafficType
  source?: ITrackingCookies
}) => {
  if (source?.referer || source?.utm_campaign) {
    await getDbCollection("trafficsources").insertOne({
      _id: new ObjectId(),
      user_id,
      application_id,
      applicant_email_hash: applicant_email ? hashEmail(applicant_email) : null,
      traffic_type,
      utm_campaign: source.utm_campaign,
      referer: source.referer,
      utm_medium: source.utm_medium,
      utm_source: source.utm_source,
    })
  }
}
