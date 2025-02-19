import { ObjectId } from "mongodb"

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { jobPartnersByFlux } from "./processJobPartners"

export const processJobPartnersForApi = async () => {
  const processId: string = new ObjectId().toString()
  await getDbCollection("computed_jobs_partners").updateMany(
    { partner_label: { $nin: jobPartnersByFlux }, currently_processed_id: null },
    { $set: { currently_processed_id: processId } }
  )
  const filter = { currently_processed_id: processId }
  await fillComputedJobsPartners(filter)
  await importFromComputedToJobsPartners(filter)
  await getDbCollection("computed_jobs_partners").deleteMany({ $and: [filter, { validated: true }] })
  await getDbCollection("computed_jobs_partners").updateMany(filter, { $set: { currently_processed_id: null } })
}
