import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { fillFieldsForComputedPartnersFactory } from "./fillFieldsForPartnersFactory"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"

const sourceFields = ["workplace_naf_code"] as const satisfies (keyof IComputedJobsPartners)[]

export const blockJobsPartnersWithNaf85 = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const filledFields = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForComputedPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.REMOVE_NAF_85,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter,
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, workplace_naf_code, business_error } = document
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id,
          business_error: workplace_naf_code?.startsWith("85") ? JOB_PARTNER_BUSINESS_ERROR.CFA : business_error,
        }
        return result
      })
    },
  })
}
