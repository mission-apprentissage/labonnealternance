import type { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import config from "@/config"
import { jobPartnersByFlux } from "./process-job-partners"

/**
 * Partenaires flux rafraîchis aussi en journée (#5670), configurés par LBA_DAYTIME_REFRESH_PARTNERS (vide : aucun).
 * Un libellé hors flux lève une erreur plutôt que d'être ignoré : un partenaire cru activé ne serait jamais rafraîchi.
 */
export const getDaytimeRefreshPartners = (): JOBPARTNERS_LABEL[] => {
  const labels = [...new Set(config.daytimeRefreshPartners.map((label) => label.trim()).filter(Boolean))]
  const unknown = labels.filter((label) => !(jobPartnersByFlux as string[]).includes(label))
  if (unknown.length) {
    throw new Error(`LBA_DAYTIME_REFRESH_PARTNERS : ${unknown.join(", ")} hors des partenaires flux (${jobPartnersByFlux.join(", ")})`)
  }
  return labels as JOBPARTNERS_LABEL[]
}
