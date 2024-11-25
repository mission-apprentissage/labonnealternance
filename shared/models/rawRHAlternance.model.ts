import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"

import { IModelDescriptor } from "./common"

export const ZRawRHAlternance = z.object({
  createdAt: z.date(),
  job: z
    .object({
      jobCode: z.string(),
      jobType: z.string().nullish(),
      jobTitle: z.string().nullish(),
      jobCity: z.string().nullish(),
      jobPostalCode: z.string().nullish(),
      jobDescription: z
        .array(
          z.object({
            descriptionHeadline: z.string().nullish(),
            descriptionText: z.string().nullish(),
          })
        )
        .nullish(),
      jobSubmitDateTime: z.string().nullish(),
      companySiret: extensions.siret.nullish(),
      companyName: z.string().nullish(),
      companyUrl: z.string().nullish(),
      companyAddress: z.string().nullish(),
      jobUrl: z.string().nullish(),
      jobCity: z.string().nullish(),
      jobPostalCode: z.string().nullish(),
    })
    .passthrough(),
})

export type IRawRHAlternance = z.output<typeof ZRawRHAlternance>
export type IRawRHAlternanceJob = IRawRHAlternance["job"]

export default {
  zod: ZRawRHAlternance,
  indexes: [],
  collectionName: "raw_rhalternance",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
