import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { IJobsPartnersOfferPrivate, ZJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model "

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { saveDbEntity } from "./user.test.utils"

export async function createComputedJobPartner(data: Partial<IComputedJobsPartners> = {}) {
  const computedJobPartner = {
    errors: [],
    validated: true,
    ...generateJobsPartnersOfferPrivate(),
    ...data,
  }
  await getDbCollection("computed_jobs_partners").insertOne(computedJobPartner)
  return computedJobPartner
}

export async function createJobPartner(data: Partial<IJobsPartnersOfferPrivate> = {}) {
  const jobPartner = {
    ...generateJobsPartnersOfferPrivate(data),
  }
  await getDbCollection("jobs_partners").insertOne(jobPartner)
  return jobPartner
}

export async function saveJobPartnerTest(data: Partial<IJobsPartnersOfferPrivate> = {}): Promise<IJobsPartnersOfferPrivate> {
  return await saveDbEntity(ZJobsPartnersOfferPrivate, (item) => getDbCollection("jobs_partners").insertOne(item), data)
}
