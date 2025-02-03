import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

const rankingMultipliers: Partial<Record<JOBPARTNERS_LABEL, number>> = {
  [JOBPARTNERS_LABEL.HELLOWORK]: 0.7,
}
const defaultRankingMultiplier = 0.5

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

export const rankJobPartners = async () => {
  const filledFields = ["rank"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.RANKING,
    sourceFields,
    filledFields,
    sourceFilter: {},
    groupSize: 500,
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, partner_label } = document
        const baseValue: number = Object.entries(fieldRankValues).reduce((acc, [fieldName, value]) => acc + (document[fieldName] ? value : 0), 0)
        const multiplier: number = (partner_label ? rankingMultipliers[partner_label] : null) ?? defaultRankingMultiplier
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
