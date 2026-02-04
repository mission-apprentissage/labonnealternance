import { COMPUTED_ERROR_SOURCE } from "shared/models/jobsPartnersComputed.model"

import type { Filter } from "mongodb"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"
import { builLbaUrlFromJob } from "@/services/jobs/jobOpportunity/jobOpportunity.service"

const sourceFields = ["workplace_siret", "_id", "partner_label", "offer_title", "workplace_naf_label"] as const satisfies (keyof IJobsPartnersOfferPrivate)[]

export const fillLbaUrl = async ({ addedMatchFilter }: { addedMatchFilter?: Filter<IJobsPartnersOfferPrivate> } = {}) => {
  const filledFields = ["lba_url"] as const satisfies (keyof IJobsPartnersOfferPrivate)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.FILL_LBA_URL,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter,
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, partner_label, workplace_siret, offer_title, workplace_naf_label } = document
        const result: Pick<IJobsPartnersOfferPrivate, (typeof filledFields)[number] | "_id"> = {
          _id,
          lba_url: builLbaUrlFromJob({ _id, partner_label, workplace_siret, offer_title, workplace_naf_label }),
        }
        return result
      })
    },
  })
}
