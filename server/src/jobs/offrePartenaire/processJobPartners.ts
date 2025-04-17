import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { logger } from "@/common/logger"

import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"
import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"

export const jobPartnersByFlux = [
  JOBPARTNERS_LABEL.HELLOWORK,
  JOBPARTNERS_LABEL.FRANCE_TRAVAIL,
  JOBPARTNERS_LABEL.RH_ALTERNANCE,
  JOBPARTNERS_LABEL.PASS,
  JOBPARTNERS_LABEL.MONSTER,
  JOBPARTNERS_LABEL.METEOJOB,
  JOBPARTNERS_LABEL.KELIO,
  JOBPARTNERS_LABEL.VERITONE,
]

export const processComputedAndImportToJobPartners = async () => {
  logger.info("début de processComputedAndImportToJobPartners")
  const filter = { partner_label: { $in: jobPartnersByFlux } }
  await fillComputedJobsPartners(filter)
  await importFromComputedToJobsPartners(filter)
  await cancelRemovedJobsPartners()
  logger.info("fin de processComputedAndImportToJobPartners")
}
