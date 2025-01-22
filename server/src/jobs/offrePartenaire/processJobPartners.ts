import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"
import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { importRHAlternanceRaw, importRHAlternanceToComputed } from "./rh-alternance/importRHAlternance"

export const processJobPartners = async () => {
  await importRHAlternanceRaw()
  await importRHAlternanceToComputed()
  // await importHelloWorkRaw()
  // await importHelloWorkToComputed()
  await fillComputedJobsPartners()
  await importFromComputedToJobsPartners()
  await cancelRemovedJobsPartners()
}
