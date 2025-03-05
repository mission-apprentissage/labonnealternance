import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

/**
 * FT job offers are always analyzed by the AI to check if it's from a company or a CFA.
 * Remove all CFA tagged in the computed_jobs_partners business_error.
 */
export const removeFTCfaFromJobsPartners = async () => {
  const jobFromCfa = await getDbCollection("computed_jobs_partners")
    .find({ business_error: JOB_PARTNER_BUSINESS_ERROR.CFA, partner_label: JOBPARTNERS_LABEL.FRANCE_TRAVAIL }, { projection: { _id: 0, partner_job_id: 1 } })
    .toArray()
  const idsToRemove = jobFromCfa.map((x) => x.partner_job_id)
  await getDbCollection("jobs_partners").deleteMany({ partner_job_id: { $in: idsToRemove } })
}
