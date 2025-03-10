import { removeFTCfaFromJobsPartners } from "@/jobs/offrePartenaire/france-travail/removeCfaFromJobsPartners"

import { classifyFranceTravailJobs } from "./classifyJobsFranceTravail"
import { importFranceTravailRaw, importFranceTravailToComputed } from "./importJobsFranceTravail"

export const processFranceTravail = async () => {
  await importFranceTravailRaw()
  await classifyFranceTravailJobs()
  await importFranceTravailToComputed()
  await removeFTCfaFromJobsPartners()
}
