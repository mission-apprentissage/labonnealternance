import { JOB_STATUS } from "shared"
import { RECRUITER_STATUS } from "shared/constants/recruteur"

import { asyncForEach } from "@/common/utils/asyncUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { updateJobsPartnersFromRecruiterById } from "@/services/formulaire.service"

export const up = async () => {
  const recruitersWithActiveJobs = await getDbCollection("recruiters").find({ status: RECRUITER_STATUS.ACTIF, "jobs.job_status": JOB_STATUS.ACTIVE }).toArray()

  await asyncForEach(recruitersWithActiveJobs, async (recruiter) => {
    await updateJobsPartnersFromRecruiterById(recruiter._id)
  })
}

// set to false ONLY IF migration does not imply a breaking change (ex: update field value or add index)
export const requireShutdown: boolean = false
