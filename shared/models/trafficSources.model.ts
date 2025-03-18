import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "trafficsources" as const

export enum TrafficType {
  ENTREPRISE = "ENTREPRISE",
  CFA = "CFA",
  APPLICATION = "APPLICATION",
  JOB = "JOB",
}
const ZTrafficType = extensions.buildEnum(TrafficType)

const ZTrackingCookies = z.object({
  utm_campaign: z.string().nullable(),
  utm_medium: z.string().nullable(),
  utm_source: z.string().nullable(),
  referer: z.string().nullable(),
})
export type ITrackingCookies = z.output<typeof ZTrackingCookies>

export const ZTrafficSource = ZTrackingCookies.extend({
  _id: zObjectId,
  user_id: zObjectId.nullish(),
  application_id: zObjectId.nullish(),
  job_id: zObjectId.nullish(),
  applicant_email_hash: z.string().nullish(),
  traffic_type: ZTrafficType,
  created_at: z.date(),
})

export type ITrafficSource = z.output<typeof ZTrafficSource>

export default {
  zod: ZTrafficSource,
  indexes: [
    [{ traffic_type: 1 }, {}],
    [{ utm_campaign: 1 }, {}],
    [{ applicant_email_hash: 1 }, {}],
    [{ user_id: 1 }, {}],
    [{ referer: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
