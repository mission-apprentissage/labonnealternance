/**
 * Recruteurs LBA alorithm file is updated every sunday (normally)
 * This file is processed every sunday
 *
 */

import Stream from "node:stream"

import { Filter } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { logger } from "@/common/logger"
import { cancelRemovedJobsPartners } from "@/jobs/offrePartenaire/cancelRemovedJobsPartners"
import { fillComputedRecruteursLba } from "@/jobs/offrePartenaire/fillComputedRecruteursLba"
import { importFromComputedToJobsPartners } from "@/jobs/offrePartenaire/importFromComputedToJobsPartners"

import { checkIfAlgoFileAlreadyProcessed, importRecruteurLbaToComputed, importRecruteursLbaRaw } from "./importRecruteursLbaRaw"

export const processRecruteursLba = async ({ sourceFileReadStream, skipCheckFileDate = false }: { sourceFileReadStream?: Stream.Readable; skipCheckFileDate?: boolean } = {}) => {
  logger.info("début de processRecruteursLba")
  if (!skipCheckFileDate) {
    const fileAlreadyProcessed = await checkIfAlgoFileAlreadyProcessed()
    if (fileAlreadyProcessed) {
      logger.info("processRecruteursLba: le fichier a déjà été traité")
      return
    }
  }

  await importRecruteursLbaRaw(sourceFileReadStream)
  await importRecruteurLbaToComputed()
  await fillComputedRecruteursLba()

  const filter: Filter<IComputedJobsPartners> = {
    partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
  }
  await importFromComputedToJobsPartners(filter)
  await cancelRemovedJobsPartners(filter)
  logger.info("fin de processRecruteursLba")
}
