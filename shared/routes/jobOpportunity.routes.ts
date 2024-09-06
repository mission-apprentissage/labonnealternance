import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { zDiplomaEuropeanLevel, ZJobsPartnersOfferApi, ZJobsPartnersRecruiterApi } from "../models/jobsPartners.model"

export const ZJobOpportunityGetQuery = z
  .object({
    latitude: extensions.latitude({ coerce: true }).nullable().default(null),
    longitude: extensions.longitude({ coerce: true }).nullable().default(null),
    radius: z.coerce.number().min(0).max(200).default(30),
    target_diploma_level: zDiplomaEuropeanLevel.optional(),
    romes: extensions.romeCodeArray().nullable().default(null),
    rncp: extensions.rncpCode().nullable().default(null),
  })
  .superRefine((data, ctx) => {
    if (data.longitude == null && data.latitude != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["longitude"],
        message: "longitude is required when latitude is provided",
      })
    }

    if (data.longitude != null && data.latitude == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["latitude"],
        message: "latitude is required when longitude is provided",
      })
    }
  })

export type IJobOpportunityGetQuery = z.output<typeof ZJobOpportunityGetQuery>

export type IJobOpportunityGetQueryResolved = Omit<IJobOpportunityGetQuery, "latitude" | "longitude" | "radius" | "rncp"> & {
  geo: { latitude: number; longitude: number; radius: number } | null
}

export const ZJobsOpportunityResponse = z.object({
  jobs: z.array(ZJobsPartnersOfferApi),
  recruiters: z.array(ZJobsPartnersRecruiterApi),
  warnings: z.array(z.object({ message: z.string(), code: z.string() })),
})

export type IJobsOpportunityResponse = z.output<typeof ZJobsOpportunityResponse>
