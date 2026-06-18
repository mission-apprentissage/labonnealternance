import { JOBPARTNERS_LABEL, jobPartnersExcludedFromFlux } from "shared/models/jobsPartners.model"
import { logger } from "@/common/logger"
import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"
import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { fillLbaUrl } from "./fillLbaUrl"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"

export const jobPartnersByFlux = Object.values(JOBPARTNERS_LABEL).filter((jobPartner) => !jobPartnersExcludedFromFlux.includes(jobPartner))

/**
 * Annule les offres des partenaires traités par flux qui ne sont plus présentes dans le flux source.
 * Sous-job CLI-safe : le filtre est encapsulé ici, jamais vide.
 */
export const cancelRemovedJobsPartnersFlux = async () => {
  await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } })
}

export const processComputedAndImportToJobPartners = async () => {
  logger.info("début de processComputedAndImportToJobPartners")
  const filter = { partner_label: { $in: jobPartnersByFlux } }
  await fillComputedJobsPartners({ addedMatchFilter: filter })
  await importFromComputedToJobsPartners(filter)
  await cancelRemovedJobsPartnersFlux()
  await fillLbaUrl()
  logger.info("fin de processComputedAndImportToJobPartners")
}
