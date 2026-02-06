import { fillEntrepriseEngagementJobsPartners } from "@/jobs/offrePartenaire/fillEntrepriseEngagementJobsPartners"

export const up = async () => {
  await fillEntrepriseEngagementJobsPartners()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
