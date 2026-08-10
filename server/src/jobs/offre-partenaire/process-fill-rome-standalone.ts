import { JOBPARTNERS_LABEL, jobPartnersExcludedFromFlux } from "shared/models/jobs-partners.model"
import { logger } from "@/common/logger"
import { fillRomeForPartners } from "./fill-rome-for-partners"

export const jobPartnersByFlux = Object.values(JOBPARTNERS_LABEL).filter((jobPartner) => !jobPartnersExcludedFromFlux.includes(jobPartner))

export const processFillRomeStandalone = async () => {
  logger.info("début de processFillRomeStandalone")
  const filter = { partner_label: { $in: jobPartnersByFlux } }
  await fillRomeForPartners({ addedMatchFilter: filter })
  logger.info("fin de processFillRomeStandalone")
}
