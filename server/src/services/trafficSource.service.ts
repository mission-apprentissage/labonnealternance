import crypto from "crypto"

import { ObjectId } from "mongodb"
import { ITrackingCookies, TrafficType } from "shared/models/index"

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
}) => saveTrafficSourceIfAny({ application_id, applicant_email, traffic_type: TrafficType.APPLICATION, source })

export const saveUserTrafficSourceIfAny = async ({ user_id, type, source }: { user_id: ObjectId; type: TrafficType; source?: ITrackingCookies }) =>
  saveTrafficSourceIfAny({ user_id, traffic_type: type, source })

export const saveJobTrafficSourceIfAny = async ({ job_id, source }: { job_id: ObjectId; source?: ITrackingCookies }) =>
  saveTrafficSourceIfAny({ job_id, traffic_type: TrafficType.JOB, source })

const saveTrafficSourceIfAny = async ({
  user_id,
  application_id,
  job_id,
  applicant_email,
  traffic_type,
  source,
}: {
  user_id?: ObjectId
  job_id?: ObjectId
  application_id?: ObjectId
  applicant_email?: string
  traffic_type: TrafficType
  source?: ITrackingCookies
}) => {
  if (source && (source?.referer || source?.utm_campaign)) {
    await getDbCollection("trafficsources").insertOne({
      _id: new ObjectId(),
      user_id,
      application_id,
      job_id,
      applicant_email_hash: applicant_email ? hashEmail(applicant_email) : null,
      traffic_type,
      utm_campaign: source.utm_campaign,
      referer: source.referer,
      utm_medium: source.utm_medium,
      utm_source: source.utm_source,
      created_at: new Date(),
    })
  }
}
