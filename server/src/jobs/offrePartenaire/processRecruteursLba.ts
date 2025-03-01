/**
 * Recruteurs LBA alorithm file is updated every sunday (normally)
 * This file is processed every sunday
 *
 */

import { fillComputedRecruteursLba, importRecruteursLbaFromComputedToJobsPartners } from "@/jobs/offrePartenaire/fillComputedRecruteursLba"

import { checkIfAlgoFileAlreadyProcessed, importRecruteurLbaToComputed, importRecruteursLbaRaw } from "./recruteur-lba/importRecruteursLbaRaw"

export const processRecruteursLba = async () => {
  const fileAlreadyProcessed = await checkIfAlgoFileAlreadyProcessed()
  if (fileAlreadyProcessed) return

  await importRecruteursLbaRaw()
  await importRecruteurLbaToComputed()
  await fillComputedRecruteursLba()
  await importRecruteursLbaFromComputedToJobsPartners()
}
