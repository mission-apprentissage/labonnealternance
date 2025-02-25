import { Filter } from "mongodb"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

const sourceFields = ["offer_rome_codes"] as const satisfies (keyof IComputedJobsPartners)[]

const blacklistedRomes: string[] = ["K2202", "G1605", "I1201", "L1102", "N4104"]

export const blockBadRomeJobsPartners = async (addedMatchFilter?: Filter<IComputedJobsPartners>) => {
  const filledFields = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.BLOCK_BAD_ROME,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter,
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, offer_rome_codes } = document
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id,
          business_error: offer_rome_codes?.some((romeCode) => blacklistedRomes.includes(romeCode)) ? JOB_PARTNER_BUSINESS_ERROR.ROME_BLACKLISTED : null,
        }
        return result
      })
    },
  })
}
