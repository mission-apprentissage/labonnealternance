import type { Filter } from "mongodb"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPANIES_TO_EXCLUDE_FROM_FLUX, COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR, PARTNER_WHITELIST } from "shared/models/jobsPartnersComputed.model"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { fillFieldsForComputedPartnersFactory } from "./fillFieldsForPartnersFactory"

const sourceFields = ["workplace_name", "workplace_legal_name"] as const satisfies (keyof IComputedJobsPartners)[]

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const companyRegexFilters: Filter<IComputedJobsPartners>[] = COMPANIES_TO_EXCLUDE_FROM_FLUX.flatMap((company) => [
  { workplace_name: { $regex: escapeRegex(company), $options: "i" } },
  { workplace_legal_name: { $regex: escapeRegex(company), $options: "i" } },
])

export const blockJobsPartnersFromFluxCompanyList = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const filledFields = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]

  const filters: Filter<IComputedJobsPartners>[] = [{ partner_label: { $nin: PARTNER_WHITELIST } }, { $or: companyRegexFilters }]
  if (addedMatchFilter) {
    filters.push(addedMatchFilter)
  }

  return fillFieldsForComputedPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.FLUX_JOB_DUPLICATE,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter: {
      $and: filters,
    },
    getData: async (documents) => {
      return documents.map(({ _id }) => ({
        _id,
        business_error: JOB_PARTNER_BUSINESS_ERROR.FLUX_JOB_DUPLICATE,
      }))
    },
  })
}
