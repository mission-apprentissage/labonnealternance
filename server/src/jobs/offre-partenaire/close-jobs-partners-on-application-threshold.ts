import { JOB_STATUS_ENGLISH } from "shared/models/index"
import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"

import { logger } from "@/common/logger"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getApplicationByJobCount } from "@/services/application.service"
import { APPLICATION_COUNT_THRESHOLD, closeJobsOnApplicationThreshold } from "@/services/application-threshold.service"

/**
 * @description Filet de sécurité de la clôture au seuil de candidatures, faite au dépôt
 * (cf. closeJobsOnApplicationThreshold) : rattrape les offres LBA actives restées au-dessus du seuil.
 */
export const closeJobsPartnersOnApplicationThreshold = async (payload?: { threshold?: string | number }) => {
  // Surchargeable (CLI --threshold) pour tester en preview sans créer autant de candidatures réelles.
  const threshold = payload?.threshold !== undefined ? Number(payload.threshold) : APPLICATION_COUNT_THRESHOLD

  const activeJobs = await getDbCollection("jobs_partners").find({ partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA, offer_status: JOB_STATUS_ENGLISH.ACTIVE }).toArray()

  if (!activeJobs.length) {
    logger.info("closeJobsPartnersOnApplicationThreshold: aucune offre active à vérifier.")
    return
  }

  const applicationCounts = await getApplicationByJobCount(activeJobs.map((job) => job._id))
  const countByJobId = new Map(applicationCounts.map((appCount) => [appCount._id, appCount.count]))

  const jobsToClose = activeJobs.filter((job) => (countByJobId.get(job._id.toString()) ?? 0) >= threshold)

  if (!jobsToClose.length) {
    logger.info(`closeJobsPartnersOnApplicationThreshold: aucune offre n'a atteint le seuil de ${threshold} candidatures.`)
    return
  }

  const closedJobs = await closeJobsOnApplicationThreshold(
    jobsToClose.map(({ _id }) => _id),
    threshold
  )

  logger.info(`closeJobsPartnersOnApplicationThreshold: ${closedJobs.length} offres clôturées (seuil de ${threshold} candidatures atteint)`)
}
