import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"
import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { importHelloWorkRaw, importHelloWorkToComputed } from "./hellowork/importHelloWork"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { importRHAlternanceRaw, importRHAlternanceToComputed } from "./rh-alternance/importRHAlternance"

export const jobPartnersByFlux = Object.values(JOBPARTNERS_LABEL)

export const processJobPartners = async () => {
  const filter = { partner_label: { $in: jobPartnersByFlux } }

  await importRHAlternanceRaw()
  await importRHAlternanceToComputed()
  await importHelloWorkRaw()
  await importHelloWorkToComputed()
  await fillComputedJobsPartners(filter)
  await importFromComputedToJobsPartners(filter)
  await cancelRemovedJobsPartners()
}
