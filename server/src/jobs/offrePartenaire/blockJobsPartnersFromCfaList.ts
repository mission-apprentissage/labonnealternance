import { Filter } from "mongodb"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { FillComputedJobsPartnersContext } from "@/jobs/offrePartenaire/fillComputedJobsPartners"
import { isCompanyInBlockedCfaList } from "@/jobs/offrePartenaire/isCompanyInBlockedCfaList"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

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

  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.BLOCK_CFA_NAME,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter,
    replaceMatchFilter: { $and: filters },
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, workplace_name } = document
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id,
          business_error: isCompanyInBlockedCfaList(workplace_name) ? JOB_PARTNER_BUSINESS_ERROR.CFA : null,
        }
        return result
      })
    },
  })
}
