import { getDbCollection } from "@/common/utils/mongodbUtils"

import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { jobPartnersByFlux } from "./processJobPartners"

export const processJobPartnersForApi = async () => {
  const filter = { partner_label: { $nin: jobPartnersByFlux } }

  await fillComputedJobsPartners(filter)
  await importFromComputedToJobsPartners(filter)
  await getDbCollection("computed_jobs_partners").deleteMany({ $and: [filter, { validated: true }] })
}
