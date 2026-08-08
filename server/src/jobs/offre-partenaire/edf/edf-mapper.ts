import { JOBPARTNERS_LABEL } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"

import { enedisJobToJobsPartnersProcessor, type IEnedisJob } from "@/jobs/offre-partenaire/enedis/enedis-mapper"

// The structure of the XML being imported from EDF is similar to Enedis, so we can reuse the same mapper processor with a different partner label
export const edfJobToJobsPartners = (job: IEnedisJob): IComputedJobsPartners => {
  return enedisJobToJobsPartnersProcessor(job, JOBPARTNERS_LABEL.EDF)
}
