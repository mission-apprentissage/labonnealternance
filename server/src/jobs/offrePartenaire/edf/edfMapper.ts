import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { enedisJobToJobsPartnersProcessor, type IEnedisJob } from "@/jobs/offrePartenaire/enedis/enedisMapper"

// The structure of the XML being imported from EDF is similar to Enedis, so we can reuse the same mapper processor with a different partner label
export const edfJobToJobsPartners = (job: IEnedisJob): IComputedJobsPartners | null => {
  return enedisJobToJobsPartnersProcessor(job, JOBPARTNERS_LABEL.EDF)
}
