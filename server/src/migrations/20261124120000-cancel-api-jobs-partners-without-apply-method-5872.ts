import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { buildJobStatusChangeUpdate } from "@/services/job-partner-status.service"

// Repris dans REACTIVATION_ALLOWED_GRANTED_BY : une offre renvoyée avec un moyen de candidature est réactivée.
const GRANTED_BY = "20261124120000-cancel-api-jobs-partners-without-apply-method-5872"

const BLANK = { $not: /\S/ }

/**
 * Annule sans notification les offres actives des partenaires API publiées sans moyen de candidature (#5872). Leur
 * computed est supprimé après import et ne repasse pas par blockJobsPartnersWithoutApplyMethod. Les offres de flux sont
 * laissées au pipeline : annulées par cancelRemovedJobsPartners, elles restent réactivables par le flux.
 */
export const up = async () => {
  const { modifiedCount } = await getDbCollection("jobs_partners").updateMany(
    {
      offer_status: JOB_STATUS_ENGLISH.ACTIVE,
      partner_label: { $nin: Object.values(JOBPARTNERS_LABEL) },
      apply_url: BLANK,
      apply_email: BLANK,
      apply_phone: BLANK,
    },
    buildJobStatusChangeUpdate({
      status: JOB_STATUS_ENGLISH.ANNULEE,
      reason: JOB_PARTNER_BUSINESS_ERROR.NO_APPLY_METHOD,
      grantedBy: GRANTED_BY,
    }),
    { bypassDocumentValidation: true }
  )

  logger.info(`cancel api jobs_partners without apply method 5872 : ${modifiedCount} offres annulées`)
}

export const requireShutdown: boolean = false
