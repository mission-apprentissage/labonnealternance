import { syncLbaJobsIntoJobsPartners } from "@/jobs/offrePartenaire/lbaJobToJobsPartners"

export const up = async () => {
  await syncLbaJobsIntoJobsPartners()
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
