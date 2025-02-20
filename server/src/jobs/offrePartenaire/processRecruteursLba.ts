/**
 * Recruteurs LBA alorithm file is updated every sunday (normally)
 * This file is processed every sunday
 *
 */
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { checkIfAlgoFileAlreadyProcessed, importRecruteurLbaToComputed, importRecruteursLbaRaw } from "./recruteur-lba/importRecruteursLbaRaw"

const filter = {
  partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
}

export const processRecruteursLba = async () => {
  const fileAlreadyProcessed = await checkIfAlgoFileAlreadyProcessed()
  if (fileAlreadyProcessed) return

  await importRecruteursLbaRaw()
  await importRecruteurLbaToComputed()
  await fillComputedJobsPartners(filter)
  await importFromComputedToJobsPartners(filter)
}
