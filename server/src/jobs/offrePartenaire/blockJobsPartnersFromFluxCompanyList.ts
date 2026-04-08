import type { Filter } from "mongodb"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR, TRUSTED_COMPANY_JOB_PARTNERS } from "shared/models/jobsPartnersComputed.model"
import { isNormalizedStringInSetOrArray } from "@/common/utils/stringUtils"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { fillFieldsForComputedPartnersFactory } from "./fillFieldsForPartnersFactory"

const sourceFields = ["workplace_name", "workplace_legal_name"] as const satisfies (keyof IComputedJobsPartners)[]

const isCompanyInFluxList = isNormalizedStringInSetOrArray(TRUSTED_COMPANY_JOB_PARTNERS)

const hasBlockedFluxCompanyMention = ({ workplace_name, workplace_legal_name }: Pick<IComputedJobsPartners, "workplace_name" | "workplace_legal_name">) => {
  return [workplace_name, workplace_legal_name].some(isCompanyInFluxList)
}

export const blockJobsPartnersFromFluxCompanyList = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const filledFields = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]

  const filters: Filter<IComputedJobsPartners>[] = [{ partner_label: { $nin: TRUSTED_COMPANY_JOB_PARTNERS } }]
  if (addedMatchFilter) {
    filters.push(addedMatchFilter)
  }

  return fillFieldsForComputedPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.TRUSTED_COMPANY_JOB_DUPLICATE,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter: {
      $and: filters,
    },
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, workplace_name, workplace_legal_name, business_error } = document
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id,
          business_error: hasBlockedFluxCompanyMention({ workplace_name, workplace_legal_name }) ? JOB_PARTNER_BUSINESS_ERROR.TRUSTED_COMPANY_JOB_DUPLICATE : business_error,
        }
        return result
      })
    },
  })
}
