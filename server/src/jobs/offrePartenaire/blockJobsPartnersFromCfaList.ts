import type { Filter } from "mongodb"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { fillFieldsForComputedPartnersFactory } from "./fillFieldsForPartnersFactory"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { isCompanyInBlockedCfaList } from "./isCompanyInBlockedCfaList"

const sourceFields = ["workplace_name"] as const satisfies (keyof IComputedJobsPartners)[]

export const blockJobsPartnersFromCfaList = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const filledFields = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]

  const filters: Filter<IComputedJobsPartners>[] = [
    {
      workplace_name: { $ne: null },
      business_error: null,
    },
  ]
  if (addedMatchFilter) filters.push(addedMatchFilter)

  return fillFieldsForComputedPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.BLOCK_CFA_NAME,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter,
    replaceMatchFilter: { $and: filters },
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, workplace_name, business_error } = document
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id,
          business_error: isCompanyInBlockedCfaList(workplace_name) ? JOB_PARTNER_BUSINESS_ERROR.CFA : business_error,
        }
        return result
      })
    },
  })
}
