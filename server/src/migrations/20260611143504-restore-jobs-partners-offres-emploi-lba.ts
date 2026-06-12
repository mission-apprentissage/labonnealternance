import type { Filter } from "mongodb"
import { JOB_STATUS_ENGLISH } from "shared"
import { type IJobsPartnersOfferPrivate, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodbUtils"

const GRANTED_BY = "20260611143504-restore-jobs-partners-offres-emploi-lba"

/**
 * Restaure les offres OFFRES_EMPLOI_LBA désactivées par erreur.
 *
 * Cible : les jobs_partners qui ont été annulés par cancelRemovedJobsPartners
 * (offer_status = Cancelled, historique avec reason "supprimée du flux source")
 * mais dont l'offre n'est PAS encore expirée.
 *
 * Action : repasse offer_status à Active et trace la réactivation dans
 * offer_status_history.
 */
export const up = async () => {
  const now = new Date()

  const filter: Filter<IJobsPartnersOfferPrivate> = {
    partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
    offer_status: JOB_STATUS_ENGLISH.ANNULEE, // "Cancelled"
    "offer_status_history.reason": "supprimée du flux source",
    // offer_expiration non dépassée. Les offres sans date d'expiration (null)
    // ne sont volontairement PAS réactivées par cette correction.
    offer_expiration: { $gt: now },
  }

  const { matchedCount, modifiedCount } = await getDbCollection("jobs_partners").updateMany(filter, {
    $set: { offer_status: JOB_STATUS_ENGLISH.ACTIVE },
    $push: {
      offer_status_history: {
        date: now,
        status: JOB_STATUS_ENGLISH.ACTIVE,
        reason: "réactivation suite à désactivation erronée du flux source",
        granted_by: GRANTED_BY,
      },
    },
  })

  logger.info(`restore offres_emploi_lba : ${modifiedCount}/${matchedCount} offres réactivées`)
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
