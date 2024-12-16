import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"
import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { importRHAlternanceRaw, importRHAlternanceToComputed } from "./importRHAlternance"

export const processJobPartners = async () => {
  await importRHAlternanceRaw()
  await importRHAlternanceToComputed()
  await fillComputedJobsPartners()
  await importFromComputedToJobsPartners()
  await cancelRemovedJobsPartners()
}
