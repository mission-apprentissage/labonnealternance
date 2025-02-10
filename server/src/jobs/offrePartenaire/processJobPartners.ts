import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"
import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
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
  await importFranceTravailToComputed()
  // missing FT clasification job (openai issue to tacle)
  await fillComputedJobsPartners()
  await importFromComputedToJobsPartners()
  await cancelRemovedJobsPartners()
}
