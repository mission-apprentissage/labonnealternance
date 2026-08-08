import { generateComputedJobsPartnersFixture, generateJobsPartnersOfferPrivate } from "shared/fixtures/job-partners.fixture"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobs-partners.model"
import type { IComputedJobsPartners } from "shared/models/jobs-partners-computed.model"

import { getDbCollection } from "@/common/utils/mongodb-utils"

export async function createComputedJobPartner(data: Partial<IComputedJobsPartners> = {}) {
  const computedJobPartner = {
    ...generateComputedJobsPartnersFixture(),
    ...data,
  }
  await getDbCollection("computed_jobs_partners").insertOne(computedJobPartner)
  return computedJobPartner
}

export async function createJobPartner(data: Partial<IJobsPartnersOfferPrivate> = {}) {
  try {
    const jobPartner = {
      ...generateJobsPartnersOfferPrivate(data),
    }
    await getDbCollection("jobs_partners").insertOne(jobPartner)
    return jobPartner
  } catch (err) {
    console.error(JSON.stringify(err, null, 2))
    throw err
  }
}
