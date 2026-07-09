import { JOBPARTNERS_LABEL, jobPartnersExcludedFromFlux } from "shared/models/jobsPartners.model"
import { logger } from "@/common/logger"
import { cancelRemovedJobsPartners } from "./cancelRemovedJobsPartners"
import { detectDuplicateJobPartners } from "./detectDuplicateJobPartners"
import { fillComputedJobsPartners } from "./fillComputedJobsPartners"
import { fillLbaUrl } from "./fillLbaUrl"
import { importFromComputedToJobsPartners } from "./importFromComputedToJobsPartners"
import { validateComputedJobPartners } from "./validateComputedJobPartners"

export const jobPartnersByFlux = Object.values(JOBPARTNERS_LABEL).filter((jobPartner) => !jobPartnersExcludedFromFlux.includes(jobPartner))

/**
 * Annule les offres des partenaires traités par flux qui ne sont plus présentes dans le flux source.
 * Sous-job CLI-safe : le filtre est encapsulé ici, jamais vide.
 */
export const cancelRemovedJobsPartnersFlux = async () => {
  await cancelRemovedJobsPartners({ partner_label: { $in: jobPartnersByFlux } })
}

export const fillComputedJobsPartnersFlux = async () => {
  await fillComputedJobsPartners({ addedMatchFilter: { partner_label: { $in: jobPartnersByFlux } }, shouldNotifySlack: true })
}

export const detectDuplicateJobPartnersFlux = async () => {
  await detectDuplicateJobPartners({ addedMatchFilter: { partner_label: { $in: jobPartnersByFlux } }, shouldNotifySlack: true })
}

export const validateComputedJobPartnersFlux = async () => {
  await validateComputedJobPartners({ addedMatchFilter: { partner_label: { $in: jobPartnersByFlux } }, shouldNotifySlack: true })
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
