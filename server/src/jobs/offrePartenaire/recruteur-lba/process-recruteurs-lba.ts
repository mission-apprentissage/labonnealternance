/**
 * Recruteurs LBA alorithm file is updated every sunday (normally)
 * This file is processed every sunday
 *
 */

import type Stream from "node:stream"

import type { Filter } from "mongodb"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { cancelRemovedJobsPartners } from "@/jobs/offrePartenaire/cancel-removed-jobs-partners"
import { fillComputedRecruteursLba } from "@/jobs/offrePartenaire/fill-computed-recruteurs-lba"
import { fillLbaUrl } from "@/jobs/offrePartenaire/fill-lba-url"
import { importFromComputedToJobsPartners } from "@/jobs/offrePartenaire/import-from-computed-to-jobs-partners"
import { checkIfAlgoFileAlreadyProcessed, importRecruteurLbaToComputed, importRecruteursLbaRaw } from "./import-recruteurs-lba-raw"

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
  await processRecruteursLbaRawToEnd()
  logger.info("fin de processRecruteursLba")
}

const recruteursLbaFilter: Filter<IComputedJobsPartners> = {
  partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA,
}

/**
 * Annule les offres recruteurs LBA qui ne sont plus présentes dans le flux source.
 * Sous-job CLI-safe : le filtre est encapsulé ici, jamais vide.
 */
export const cancelRemovedJobsPartnersRecruteursLba = async () => {
  await cancelRemovedJobsPartners(recruteursLbaFilter)
}

export async function processRecruteursLbaRawToEnd() {
  await importRecruteurLbaToComputed()
  await fillComputedRecruteursLba()

  await importFromComputedToJobsPartners(recruteursLbaFilter)
  await fillLbaUrl()
  await cancelRemovedJobsPartnersRecruteursLba()
}
