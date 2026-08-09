import type { Filter } from "mongodb"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobs-partners-computed.model"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { buildLbaUrlFromJob } from "@/services/jobs/job-opportunity/job-opportunity.service"
import { fillFieldsForPartnersFactory } from "./fill-fields-for-partners-factory"

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
          lba_url: buildLbaUrlFromJob({ _id, partner_label, workplace_siret, offer_title, workplace_naf_label }),
        }
        return result
      })
    },
  })
}

export const renewLbaUrl = async () => {
  await getDbCollection("jobs_partners").updateMany({}, { $set: { lba_url: null } })
  await fillLbaUrl()
}
