import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { fillFieldsForComputedPartnersFactory } from "./fillFieldsForPartnersFactory"
import { isCompanyInBlockedCfaList } from "./isCompanyInBlockedCfaList"

const sourceFields = ["workplace_name", "offer_description", "workplace_description"] as const satisfies (keyof IComputedJobsPartners)[]

// La detection actuelle reste volontairement simple. Si le cout devient trop
// eleve sur des champs texte longs avec la taille actuelle de la blacklist,
// privilegier un matcher Aho-Corasick en conservant `cfaCompanyList` comme
// source de verite. Voir /docs/optimization/blocked-cfa-aho-corasick.md.
const hasBlockedCfaMention = ({
  workplace_name,
  offer_description,
  workplace_description,
}: Pick<IComputedJobsPartners, "workplace_name" | "offer_description" | "workplace_description">) => {
  return [workplace_name, offer_description, workplace_description].some(isCompanyInBlockedCfaList)
}

export const blockJobsPartnersFromCfaList = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const filledFields = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]

  return fillFieldsForComputedPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.BLOCK_CFA_NAME,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter,
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
