import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model";
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobsPartnersComputed.model"

import { fillFieldsForPartnersFactory } from "./fillFieldsForPartnersFactory"
import type { FillComputedJobsPartnersContext } from "./fillComputedJobsPartners"
import { buildUrlLba } from "./importFromComputedToJobsPartners"


const sourceFields = ["workplace_siret", "_id", "partner_label", "offer_title"] as const satisfies (keyof IComputedJobsPartners)[]

export const fillLbaUrl = async ({ addedMatchFilter }: FillComputedJobsPartnersContext) => {
  const filledFields = ["lba_url"] as const satisfies (keyof IComputedJobsPartners)[]
  return fillFieldsForPartnersFactory({
    job: COMPUTED_ERROR_SOURCE.FILL_LBA_URL,
    sourceFields,
    filledFields,
    groupSize: 500,
    addedMatchFilter,
    getData: async (documents) => {
      return documents.map((document) => {
        const { _id, partner_label, workplace_siret, offer_title } = document
        const result: Pick<IComputedJobsPartners, (typeof filledFields)[number] | "_id"> = {
          _id,
          lba_url: buildUrlLba(partner_label, _id.toString(), workplace_siret ?? null, offer_title ?? undefined),
        }
        return result
      })
    },
  })
}
