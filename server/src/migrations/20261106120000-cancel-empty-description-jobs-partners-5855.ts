import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { jobPartnersExcludedFromFlux } from "shared/models/jobs-partners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { buildJobStatusChangeUpdate } from "@/services/job-partner-status.service"

const GRANTED_BY = "20261106120000-cancel-empty-description-jobs-partners-5855"

/**
 * Annule sans notification les offres partenaires actives publiées avec une offer_description vide (#5855).
 *
 * Le pipeline les bloque désormais en WRONG_DATA à la sanitization, mais rien n'annule les offres déjà publiées :
 * cancelRemovedJobsPartners ne cible que les offres sans computed, et les offres API n'y passent pas.
 *
 * `reason` reprend le business_error posé par le pipeline. job_status_comment n'est pas renseigné : il porte le motif
 * choisi par un humain dans la modale de clôture (cf. JOB_CLOSURE_REASON). OFFRES_EMPLOI_LBA et RECRUTEURS_LBA sont
 * exclus : ils ne passent pas par le pipeline computed.
 * L'index de recherche est mis à jour par le cron delta via updated_at.
 */
export const up = async () => {
  const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(
    {
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      partner_label: { $nin: jobPartnersExcludedFromFlux },
      // Chaîne vide, blancs seuls, null ou champ absent : $not matche aussi les champs absents.
      offer_description: { $not: /\S/ },
    },
    buildJobStatusChangeUpdate({
      status: JOB_STATUS_ENGLISH.ANNULEE,
      reason: JOB_PARTNER_BUSINESS_ERROR.WRONG_DATA,
      grantedBy: GRANTED_BY,
    }),
    { bypassDocumentValidation: true }
  )

  logger.info(`cancel empty description jobs_partners 5855 : ${modifiedCount} offres annulées`)
}

export const requireShutdown: boolean = false
