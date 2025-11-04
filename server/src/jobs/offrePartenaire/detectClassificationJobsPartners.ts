import type { Filter } from "mongodb"
import type { IComputedJobsPartners} from "shared/models/jobsPartnersComputed.model";
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { getClassificationFromLab } from "@/services/cacheClassification.service"


export const detectClassificationJobsPartners = async ({ addedMatchFilter, shouldNotifySlack }: FillComputedJobsPartnersContext) => {
  const filledFields = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]
  const filters: Filter<IComputedJobsPartners>[] = [
    {
      business_error: null,
    },
  ]
  if (addedMatchFilter) filters.push(addedMatchFilter)

  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.CLASSIFICATION,
    sourceFields: ["workplace_description", "workplace_name", "offer_description", "offer_title", "partner_job_id", "partner_label"],
    filledFields,
    groupSize: 100,
    addedMatchFilter,
    replaceMatchFilter: { $and: filters },
    getData: async (documents) => {
      const payload = documents.map((document) => {
        const { workplace_description, offer_description, offer_title, workplace_name, partner_job_id, partner_label } = document
        return {
          workplace_name: workplace_name ?? undefined,
          workplace_description: workplace_description ?? undefined,
          offer_title: offer_title ?? undefined,
          offer_description: offer_description ?? undefined,
          partner_job_id,
          partner_label,
        }
      })
      const classifications = await getClassificationFromLab(payload)

      return documents.map((document, index) => {
        const { _id, business_error } = document
        const classification = classifications[index]
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id,
          business_error: classification && classification === "cfa" ? JOB_PARTNER_BUSINESS_ERROR.CFA : business_error,
        }
        return result
      })
    },
    shouldNotifySlack,
  })
}
