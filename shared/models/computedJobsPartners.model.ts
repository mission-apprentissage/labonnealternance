import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor } from "./common"
import { ZJobsPartners, ZJobsPartnersApply, ZJobsPartnersContract, ZJobsPartnersJobOffer, ZJobsPartnersLocation, ZJobsPartnersWorkplace } from "./jobsPartners.model"

export const ZComputedJobsPartners = ZJobsPartners.omit({
  contract: true,
  job_offer: true,
  workplace: true,
  apply: true,
})
  .extend({
    contract: ZJobsPartnersContract.partial(),
    job_offer: ZJobsPartnersJobOffer.partial(),
    workplace: ZJobsPartnersWorkplace.omit({
      location: true,
    })
      .extend({
        location: ZJobsPartnersLocation.partial(),
      })
      .partial(),
    apply: ZJobsPartnersApply.partial(),
  })
  .partial()

export type IComputedJobsPartners = z.output<typeof ZComputedJobsPartners>

export default {
  zod: ZComputedJobsPartners,
  indexes: [
    [{ raw_id: 1 }, {}],
    [{ partner_label: 1 }, {}],
  ],
  collectionName: "computed_jobs_partners" as const,
} as const satisfies IModelDescriptor
