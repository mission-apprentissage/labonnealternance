import type { Filter } from "mongodb"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR, PARTNER_WHITELIST } from "shared/models/jobsPartnersComputed.model"
import { GEIQ_WHITELIST } from "@/jobs/offrePartenaire/geiqWhitelist"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { fillFieldsForComputedPartnersFactory } from "./fillFieldsForPartnersFactory"
import { getCompanyInBlockedCfaList } from "./isCompanyInBlockedCfaList"

const sourceFields = ["workplace_name", "offer_description", "workplace_description"] as const satisfies (keyof IComputedJobsPartners)[]

// La détection actuelle reste volontairement simple. Si le coût devient trop
// élevé sur des champs texte longs avec la taille actuelle de la blacklist,
// privilégier un matcher Aho-Corasick en conservant `cfaCompanyList` comme
// source de vérité. Voir /docs/optimization/blocked-cfa-aho-corasick.md.
const hasBlockedCfaMention = (props: Pick<IComputedJobsPartners, "workplace_name" | "offer_description" | "workplace_description">): boolean => {
  return Boolean(getBlockedCfaMention(props))
}

export const getBlockedCfaMention = (props: Pick<IComputedJobsPartners, "workplace_name" | "offer_description" | "workplace_description">): string | null => {
  let found: { field: string; matchingString: string } | null = null
  const fields = ["workplace_name", "offer_description", "workplace_description"] as const
  fields.find((field) => {
    const value = props[field]
    const matchingString = getCompanyInBlockedCfaList(value)
    if (matchingString) {
      found = { field, matchingString }
    }
    return Boolean(matchingString)
  })
  return found
}

export const blockJobsPartnersFromCfaList = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const filledFields = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]

  const filters: Filter<IComputedJobsPartners>[] = [{ partner_label: { $nin: PARTNER_WHITELIST } }, { workplace_siret: { $nin: GEIQ_WHITELIST } }]
  if (addedMatchFilter) {
    filters.push(addedMatchFilter)
  }

  return fillFieldsForComputedPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.BLOCK_CFA_NAME,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter: {
      $and: filters,
    },
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, workplace_name, offer_description, workplace_description, business_error } = document
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id,
          business_error: hasBlockedCfaMention({ workplace_name, offer_description, workplace_description }) ? JOB_PARTNER_BUSINESS_ERROR.CFA_BLACKLISTED : business_error,
        }
        return result
      })
    },
  })
}
