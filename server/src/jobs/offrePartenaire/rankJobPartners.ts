import { Filter } from "mongodb"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"
import { jobPartnersRankConfig, jobPartnersRankDefaultFactor } from "./jobPartnersRankConfig"

const sourceFields = [
  "apply_email",
  "workplace_siret",
  "workplace_description",
  "apply_phone",
  "offer_target_diploma",
  "workplace_website",
  "partner_label",
] as const satisfies (keyof IComputedJobsPartners)[]

const fieldRankValues: Partial<Record<(typeof sourceFields)[number], number>> = {
  apply_email: 50,
  workplace_siret: 50,
  workplace_description: 20,
  apply_phone: 10,
  offer_target_diploma: 10,
  workplace_website: 10,
}

export const rankJobPartners = async (addedMatchFilter?: Filter<IComputedJobsPartners>) => {
  const filledFields = ["rank"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.RANKING,
    sourceFields,
    filledFields,
    replaceMatchFilter: {},
    groupSize: 500,
    addedMatchFilter,
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, partner_label } = document
        const baseValue: number = Object.entries(fieldRankValues).reduce((acc, [fieldName, value]) => acc + (document[fieldName] ? value : 0), 0)
        const multiplier: number = (partner_label ? jobPartnersRankConfig[partner_label] : null) ?? jobPartnersRankDefaultFactor
        const rank = baseValue * multiplier

        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id,
          rank,
        }
        return result
      })
    },
  })
}
