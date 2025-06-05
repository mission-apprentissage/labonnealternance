import { JOBPARTNERS_LABEL, jobPartnersExcludedFromFlux } from "shared/models/jobsPartners.model"

import { logger } from "@/common/logger"
import { fillRomeForPartners } from "@/jobs/offrePartenaire/fillRomeForPartners"

export const jobPartnersByFlux = Object.values(JOBPARTNERS_LABEL).filter((jobPartner) => !jobPartnersExcludedFromFlux.includes(jobPartner))

export const processFillRomeStandalone = async () => {
  logger.info("début de processFillRomeStandalone")
  const filter = { partner_label: { $in: jobPartnersByFlux } }
  await fillRomeForPartners(filter)
  logger.info("fin de processFillRomeStandalone")
}
