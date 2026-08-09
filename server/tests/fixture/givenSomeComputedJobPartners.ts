import { generateComputedJobsPartnersFixture } from "shared/fixtures/job-partners.fixture"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"

export const givenSomeComputedJobPartners = async (jobs: Partial<IComputedJobsPartners>[]) => {
  const finalJobs = jobs.map(generateComputedJobsPartnersFixture)
  await getDbCollection("computed_jobs_partners").insertMany(finalJobs)
  return finalJobs
}
