import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"
import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"

export const jobPartnersByFlux = Object.values(JOBPARTNERS_LABEL).filter((v) => v !== JOBPARTNERS_LABEL.RECRUTEURS_LBA)

export const processJobPartners = async () => {
  const filter = { partner_label: { $in: jobPartnersByFlux } }
  await fillComputedJobsPartners(filter)
  await importFromComputedToJobsPartners(filter)
  await cancelRemovedJobsPartners()
}
