import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { zDiplomaEuropeanLevel, ZJobsPartnersOfferApi, ZJobsPartnersRecruiterApi } from "../models/jobsPartners.model"

const romes = extensions.romeCodeArray()
const rncp = extensions.rncpCode()

const ZJobOpportunityQuerystringBase = z.object({
  latitude: extensions.latitude(),
  longitude: extensions.longitude(),
  radius: z.number().min(0).max(200).default(30),
  diplomaLevel: zDiplomaEuropeanLevel.optional(),
})

export const ZJobOpportunityRome = ZJobOpportunityQuerystringBase.extend({ romes })
export const ZJobOpportunityRncp = ZJobOpportunityQuerystringBase.extend({ rncp })
export type IJobOpportunityRome = z.output<typeof ZJobOpportunityRome>
export type IJobOpportunityRncp = z.output<typeof ZJobOpportunityRncp>

export const ZJobsOpportunityResponse = z.object({
  jobs: z.array(ZJobsPartnersOfferApi),
  recruiters: z.array(ZJobsPartnersRecruiterApi),
})

export type IJobsOpportunityResponse = z.output<typeof ZJobsOpportunityResponse>
