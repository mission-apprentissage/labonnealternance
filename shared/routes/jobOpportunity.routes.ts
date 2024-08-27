import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { zDiplomaEuropeanLevel, ZJobsPartnersOfferApi, ZJobsPartnersRecruiterApi } from "../models/jobsPartners.model"

export const ZJobOpportunityGetQuery = z.object({
  latitude: extensions.latitude(),
  longitude: extensions.longitude(),
  radius: z.number().min(0).max(200).default(30),
  diplomaLevel: zDiplomaEuropeanLevel.optional(),
  romes: extensions.romeCodeArray().optional(),
  rncp: extensions.rncpCode().optional(),
})

export type IJobOpportunityGetQuery = z.output<typeof ZJobOpportunityGetQuery>

export const ZJobsOpportunityResponse = z.object({
  jobs: z.array(ZJobsPartnersOfferApi),
  recruiters: z.array(ZJobsPartnersRecruiterApi),
  warnings: z.array(z.object({ message: z.string(), code: z.string() })),
})

export type IJobsOpportunityResponse = z.output<typeof ZJobsOpportunityResponse>
