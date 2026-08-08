import { generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"

export const givenSomeJobPartners = async (jobs: Partial<IJobsPartnersOfferPrivate>[]) => {
  const finalJobs = jobs.map(generateJobsPartnersOfferPrivate)
  await getDbCollection("jobs_partners").insertMany(finalJobs)
  return finalJobs
}
