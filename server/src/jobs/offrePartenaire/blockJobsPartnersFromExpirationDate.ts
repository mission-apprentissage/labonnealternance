import { JOB_STATUS_ENGLISH } from "shared/models/index"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { fillFieldsForComputedPartnersFactory } from "./fillFieldsForPartnersFactory"

const sourceFields = ["offer_expiration"] as const satisfies (keyof IComputedJobsPartners)[]

export const blockJobsPartnersFromExpirationDate = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const filledFields = ["business_error", "offer_status"] as const satisfies (keyof IComputedJobsPartners)[]

  return fillFieldsForComputedPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.VALID_EXPIRATION_DATE,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter,
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, offer_expiration, business_error } = document
        const isExpired = Boolean(offer_expiration && new Date(offer_expiration) < new Date())
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id,
          business_error: isExpired ? JOB_PARTNER_BUSINESS_ERROR.EXPIRED : business_error,
          offer_status: isExpired ? JOB_STATUS_ENGLISH.ANNULEE : document.offer_status,
        }
        return result
      })
    },
  })
}
