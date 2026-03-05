import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobsPartnersComputed.model"

import { fillFieldsForComputedPartnersFactory } from "./fillFieldsForPartnersFactory"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { sanitizeTextField } from "@/common/utils/stringUtils"

const fields = ["workplace_description", "workplace_name", "offer_description", "offer_title"] as const satisfies (keyof IComputedJobsPartners)[]

export const formatTextFieldsJobsPartners = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const job = COMPUTED_ERROR_SOURCE.SANITIZE_TEXT_FIELDS
  return fillFieldsForComputedPartnersFactory({
    job,
    sourceFields: fields,
    filledFields: fields,
    groupSize: 500,
    replaceMatchFilter: {
      $and: [{ $or: fields.map((f) => ({ [f]: { $ne: null } })) }, { business_error: null }, { jobs_in_success: { $nin: [job] } }, ...(addedMatchFilter ? [addedMatchFilter] : [])],
    },
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, workplace_description, offer_description, offer_title, workplace_name } = document
        const result: Pick<IComputedJobsPartners, (typeof fields)[number] | "_id"> = {
          _id,
          workplace_description: sanitizeTextField(workplace_description, true),
          workplace_name: sanitizeTextField(workplace_name, true),
          offer_description: sanitizeTextField(offer_description, true),
          offer_title: sanitizeTextField(offer_title, true),
        }
        return result
      })
    },
  })
}
