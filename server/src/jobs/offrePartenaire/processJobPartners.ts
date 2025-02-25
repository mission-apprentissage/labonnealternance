import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"
import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { classifyFranceTravailJobs } from "./france-travail/classifyJobsFranceTravail"
import { importFranceTravailRaw, importFranceTravailToComputed } from "./france-travail/importJobsFranceTravail"
import { importHelloWorkRaw, importHelloWorkToComputed } from "./hellowork/importHelloWork"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { importMeteojobRaw, importMeteojobToComputed } from "./meteojob/importMeteojob"
import { importRHAlternanceRaw, importRHAlternanceToComputed } from "./rh-alternance/importRHAlternance"

export const jobPartnersByFlux = Object.values(JOBPARTNERS_LABEL).filter((v) => v !== JOBPARTNERS_LABEL.RECRUTEURS_LBA)

export const processJobPartners = async () => {
  const filter = { partner_label: { $in: jobPartnersByFlux } }

  await importRHAlternanceRaw()
  await importRHAlternanceToComputed()
  await importHelloWorkRaw()
  await importHelloWorkToComputed()
  await importMeteojobRaw()
  await importMeteojobToComputed()
  await importFranceTravailRaw()
  await classifyFranceTravailJobs()
  await importFranceTravailToComputed()

  await fillComputedJobsPartners(filter)
  await importFromComputedToJobsPartners(filter)
  await cancelRemovedJobsPartners()
}
