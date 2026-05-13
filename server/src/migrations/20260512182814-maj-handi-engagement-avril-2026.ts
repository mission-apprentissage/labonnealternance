import { addJob } from "job-processor"
import { logger } from "@/common/logger"

export const up = async () => {
  logger.info("Scheduling jobs for refreshEntrepriseEngagementJobsPartners migration")
  await addJob({ name: "refreshReferentielEngagementFranceTravail", queued: true })
  await addJob({ name: "refreshEntrepriseEngagementJobsPartners", queued: true })
  logger.info("Jobs scheduled for refreshEntrepriseEngagementJobsPartners migration")
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
