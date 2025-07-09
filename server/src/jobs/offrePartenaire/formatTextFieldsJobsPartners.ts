import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { sanitizeTextField } from "@/common/utils/stringUtils"
import { FillComputedJobsPartnersContext } from "@/jobs/offrePartenaire/fillComputedJobsPartners"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

const fields = ["workplace_description", "workplace_name", "offer_description", "offer_title"] as const satisfies (keyof IComputedJobsPartners)[]

export const formatTextFieldsJobsPartners = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.BLOCK_BAD_ROME,
    sourceFields: ["offer_title"],
    filledFields: fields,
    groupSize: 500,
    addedMatchFilter,
    replaceMatchFilter: [{ $or: { workplace_description: { $ne: null }, workplace_name: { $ne: null }, offer_description: { $ne: null } } }],
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, workplace_description, offer_description, offer_title, workplace_name } = document
        const result: Pick<IComputedJobsPartners, (typeof fields)[number] | "_id"> = {
          _id,
          workplace_description: sanitizeTextField(workplace_description),
          workplace_name: sanitizeTextField(workplace_name),
          offer_description: sanitizeTextField(offer_description),
          offer_title: sanitizeTextField(offer_title),
        }
        return result
      })
    },
  })
}
