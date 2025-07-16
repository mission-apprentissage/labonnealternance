import { Filter } from "mongodb"
import { COMPUTED_ERROR_SOURCE, IComputedJobsPartners, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { FillComputedJobsPartnersContext } from "@/jobs/offrePartenaire/fillComputedJobsPartners"
import { getClassificationFromLab } from "@/services/cacheClassification.service"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"

export const detectClassificationJobsPartners = async ({ addedMatchFilter, shouldNotifySlack }: FillComputedJobsPartnersContext) => {
  const filledFields = ["business_error"] as const satisfies (keyof IComputedJobsPartners)[]
  const filters: Filter<IComputedJobsPartners>[] = [{ workplace_description: { $ne: null } }, { workplace_name: { $ne: null } }, { offer_description: { $ne: null } }]
  if (addedMatchFilter) filters.push(addedMatchFilter)

  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.CLASSIFICATION,
    sourceFields: ["workplace_description", "workplace_name", "offer_description", "offer_title", "partner_job_id", "partner_label"],
    filledFields,
    groupSize: 1,
    addedMatchFilter,
    replaceMatchFilter: { $and: filters },
    getData: async (documents) => {
      const [document] = documents
      const { _id, workplace_description, offer_description, offer_title, workplace_name, partner_job_id, partner_label } = document
      const classification = await getClassificationFromLab({
        workplace_name: workplace_name!,
        workplace_description: workplace_description!,
        offer_title: offer_title!,
        offer_description: offer_description!,
        partner_job_id,
        partner_label,
      })
      const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
        _id,
        business_error: classification && classification === "cfa" ? JOB_PARTNER_BUSINESS_ERROR.CFA : null,
      }
      return [result]
    },
    shouldNotifySlack,
  })
}
