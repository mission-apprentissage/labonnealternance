import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { jobPartnersExcludedFromFlux } from "shared/models/jobs-partners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { buildJobStatusChangeUpdate } from "@/services/job-partner-status.service"

const GRANTED_BY = "20261106120000-cancel-empty-description-jobs-partners-5855"

/**
 * Libellés figés ici : la migration cible les valeurs présentes en base, cancelRemovedJobsPartners et expireJobsPartners
 * écrivent désormais le code EXPIRED.
 */
const EXPIRED_REASONS = {
  "offre expirée": "EXPIRED",
  "offre expirée (date dépassée)": "EXPIRED (date dépassée)",
} as const

export const up = async () => {
  await cancelEmptyDescriptionOffers()
  await renameExpiredReasons()
}

/**
 * Volet 1 — annule sans notification les offres partenaires actives publiées avec une offer_description vide (#5855).
 * Le pipeline les bloque en DESCRIPTION_TOO_SHORT, puis cancelRemovedJobsPartners annule les offres de flux au prochain
 * import. Les offres API n'y passent pas. `reason` reprend ce business_error.
 */
const cancelEmptyDescriptionOffers = async () => {
  const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(
    {
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      partner_label: { $nin: jobPartnersExcludedFromFlux },
      // Chaîne vide, blancs seuls, null ou champ absent : $not matche aussi les champs absents.
      offer_description: { $not: /\S/ },
    },
    buildJobStatusChangeUpdate({
      status: JOB_STATUS_ENGLISH.ANNULEE,
      reason: JOB_PARTNER_BUSINESS_ERROR.DESCRIPTION_TOO_SHORT,
      grantedBy: GRANTED_BY,
    }),
    { bypassDocumentValidation: true }
  )

  logger.info(`cancel empty description jobs_partners 5855 : ${modifiedCount} offres annulées`)
}

/**
 * Volet 2 — remplace les libellés d'expiration de offer_status_history par le code EXPIRED. `updated_at` n'est pas touché :
 * les tableaux de bord datent les clôtures sur ce champ.
 */
const renameExpiredReasons = async () => {
  for (const [from, to] of Object.entries(EXPIRED_REASONS)) {
    const { matchedCount, modifiedCount } = await getDbCollection("jobs_partners").updateMany(
      { "offer_status_history.reason": from },
      { $set: { "offer_status_history.$[entry].reason": to } },
      { arrayFilters: [{ "entry.reason": from }], bypassDocumentValidation: true }
    )
    logger.info(`rename expired reasons 5855 : "${from}" remplacé par "${to}" sur ${modifiedCount}/${matchedCount} offres`)
  }
}

export const requireShutdown: boolean = false
