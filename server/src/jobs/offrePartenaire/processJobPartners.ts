import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"
import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { classifyFranceTravailJobs } from "./france-travail/classifyJobsFranceTravail"
import { importFranceTravailRaw, importFranceTravailToComputed } from "./france-travail/importJobsFranceTravail"
import { importHelloWorkRaw, importHelloWorkToComputed } from "./hellowork/importHelloWork"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { importRHAlternanceRaw, importRHAlternanceToComputed } from "./rh-alternance/importRHAlternance"

export const processJobPartners = async () => {
  await importRHAlternanceRaw()
  await importRHAlternanceToComputed()
  await importHelloWorkRaw()
  await importHelloWorkToComputed()
  await importFranceTravailRaw()
  await classifyFranceTravailJobs()
  await importFranceTravailToComputed()
  await fillComputedJobsPartners()
  await importFromComputedToJobsPartners()
  await cancelRemovedJobsPartners()
}
