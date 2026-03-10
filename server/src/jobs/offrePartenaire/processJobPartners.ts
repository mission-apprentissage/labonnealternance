import { JOBPARTNERS_LABEL, jobPartnersExcludedFromFlux } from "shared/models/jobsPartners.model"
import { logger } from "@/common/logger"
import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"
import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { fillLbaUrl } from "./fillLbaUrl"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"

export const jobPartnersByFlux = Object.values(JOBPARTNERS_LABEL).filter((jobPartner) => !jobPartnersExcludedFromFlux.includes(jobPartner))

export const processComputedAndImportToJobPartners = async () => {
  logger.info("début de processComputedAndImportToJobPartners")
  const filter = { partner_label: { $in: jobPartnersByFlux } }
  await fillComputedJobsPartners({ addedMatchFilter: filter })
  await importFromComputedToJobsPartners(filter)
  await cancelRemovedJobsPartners(filter)
  await fillLbaUrl()
  logger.info("fin de processComputedAndImportToJobPartners")
}
