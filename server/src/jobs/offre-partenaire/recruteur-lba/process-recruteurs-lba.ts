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
import { withoutChildSpans } from "@/common/utils/sentry-utils"
import { cancelRemovedJobsPartners } from "@/jobs/offre-partenaire/cancel-removed-jobs-partners"
import { fillComputedRecruteursLba } from "@/jobs/offre-partenaire/fill-computed-recruteurs-lba"
import { fillLbaUrl } from "@/jobs/offre-partenaire/fill-lba-url"
import { importFromComputedToJobsPartners } from "@/jobs/offre-partenaire/import-from-computed-to-jobs-partners"
import { checkIfAlgoFileAlreadyProcessed, importRecruteurLbaToComputed, importRecruteursLbaRaw } from "./import-recruteurs-lba-raw"

type ProcessRecruteursLbaOptions = { sourceFileReadStream?: Stream.Readable; skipCheckFileDate?: boolean }

// ~350 000 recruteurs, une requête MongoDB par document à plusieurs étapes, cf. withoutChildSpans.
export const processRecruteursLba = (options: ProcessRecruteursLbaOptions = {}) => withoutChildSpans(() => runProcessRecruteursLba(options))

const runProcessRecruteursLba = async ({ sourceFileReadStream, skipCheckFileDate = false }: ProcessRecruteursLbaOptions) => {
  logger.info("début de processRecruteursLba")
  if (!skipCheckFileDate) {
    const fileAlreadyProcessed = await checkIfAlgoFileAlreadyProcessed()
    if (fileAlreadyProcessed) {
      logger.info("processRecruteursLba: le fichier a déjà été traité")
      return
    }
  }

  const raw = await importRecruteursLbaRaw(sourceFileReadStream)
  const rest = await runProcessRecruteursLbaRawToEnd()
  logger.info("fin de processRecruteursLba")
  return { raw, ...rest }
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

export const processRecruteursLbaRawToEnd = () => withoutChildSpans(runProcessRecruteursLbaRawToEnd)

async function runProcessRecruteursLbaRawToEnd() {
  const computed = await importRecruteurLbaToComputed()
  await fillComputedRecruteursLba()

  const imported = await importFromComputedToJobsPartners(recruteursLbaFilter)
  await fillLbaUrl()
  await cancelRemovedJobsPartnersRecruteursLba()

  return { computed, imported }
}
