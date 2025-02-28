/**
 * Recruteurs LBA alorithm file is updated every sunday (normally)
 * This file is processed every sunday
 *
 */
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { blockBadRomeJobsPartners } from "@/jobs/offrePartenaire/blockBadRomeJobsPartners"
import { fillLocationInfosForPartners } from "@/jobs/offrePartenaire/fillLocationInfosForPartners"
import { fillOpcoInfosForPartners } from "@/jobs/offrePartenaire/fillOpcoInfosForPartners"
import { validateComputedJobPartners } from "@/jobs/offrePartenaire/validateComputedJobPartners"

import { getDbCollection } from "../../common/utils/mongodbUtils"

import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { checkIfAlgoFileAlreadyProcessed, importRecruteurLbaToComputed, importRecruteursLbaRaw, removeMissingRecruteursLbaFromRaw } from "./recruteur-lba/importRecruteursLbaRaw"

const filter = {
  partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
}

export const processRecruteursLba = async () => {
  const fileAlreadyProcessed = await checkIfAlgoFileAlreadyProcessed()
  if (fileAlreadyProcessed) return

  await importRecruteursLbaRaw()
  await importRecruteurLbaToComputed()
  await removeMissingRecruteursLbaFromRaw()
  await fillOpcoInfosForPartners(filter)
  await fillLocationInfosForPartners(filter)
  await blockBadRomeJobsPartners(filter)
  await validateComputedJobPartners(filter)
  await getDbCollection("jobs_partners").deleteMany(filter)
  await importFromComputedToJobsPartners(filter)
}
