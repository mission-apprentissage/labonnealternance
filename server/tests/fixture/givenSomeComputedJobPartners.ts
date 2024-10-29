import { generateComputedJobsPartnersFixture } from "shared/fixtures/jobPartners.fixture"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const givenSomeComputedJobPartners = async (jobs: Partial<IComputedJobsPartners>[]) => {
  const finalJobs = jobs.map(generateComputedJobsPartnersFixture)
  await getDbCollection("computed_jobs_partners").insertMany(finalJobs)
  return finalJobs
}
