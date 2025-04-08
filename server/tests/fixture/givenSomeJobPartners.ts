import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"

export const givenSomeJobPartners = async (jobs: Partial<IJobsPartnersOfferPrivate>[]) => {
  const finalJobs = jobs.map(generateJobsPartnersOfferPrivate)
  await getDbCollection("jobs_partners").insertMany(finalJobs)
  return finalJobs
}
