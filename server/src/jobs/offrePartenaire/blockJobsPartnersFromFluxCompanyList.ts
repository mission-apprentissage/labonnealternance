import type { Filter } from "mongodb"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPANIES_TO_EXCLUDE_FROM_FLUX, COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR, PARTNER_WHITELIST } from "shared/models/jobsPartnersComputed.model"
import { isNormalizedStringInSetOrArray, stringNormaliser } from "@/common/utils/stringUtils"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { fillFieldsForComputedPartnersFactory } from "./fillFieldsForPartnersFactory"

const sourceFields = ["workplace_name", "workplace_legal_name"] as const satisfies (keyof IComputedJobsPartners)[]
const normalizedFluxList: string[] = COMPANIES_TO_EXCLUDE_FROM_FLUX.map(stringNormaliser)
const normalizedFluxSet: Set<string> = new Set(normalizedFluxList)

const isCompanyInFluxList = (nom: string | null | undefined): boolean => isNormalizedStringInSetOrArray(nom, normalizedFluxSet, normalizedFluxList)

const hasBlockedFluxCompanyMention = ({ workplace_name, workplace_legal_name }: Pick<IComputedJobsPartners, "workplace_name" | "workplace_legal_name">) => {
  return [workplace_name, workplace_legal_name].some(isCompanyInFluxList)
}

export const blockJobsPartnersFromFluxCompanyList = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const filledFields = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]

  const filters: Filter<IComputedJobsPartners>[] = [{ partner_label: { $nin: COMPANIES_TO_EXCLUDE_FROM_FLUX } }]
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
      return documents.map((document) => {
        const { _id, workplace_name, workplace_legal_name, business_error } = document
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id,
          business_error: hasBlockedFluxCompanyMention({ workplace_name, workplace_legal_name }) ? JOB_PARTNER_BUSINESS_ERROR.FLUX_JOB_DUPLICATE : business_error,
        }
        return result
      })
    },
  })
}
