import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { FillComputedJobsPartnersContext } from "@/jobs/offrePartenaire/fillComputedJobsPartners"
import { isCompanyInBlockedCfaList } from "@/jobs/offrePartenaire/isCompanyInBlockedCfaList"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

const sourceFields = ["workplace_name"] as const satisfies (keyof IComputedJobsPartners)[]

export const blockJobsPartnersFromCfaList = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const filledFields = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.BLOCK_CFA_NAME,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter,
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
