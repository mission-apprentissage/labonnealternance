import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { IJobsPartnersOfferPrivate, ZJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model "

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { saveDbEntity } from "./user.test.utils"

export async function createComputedJobPartner(data: Partial<IComputedJobsPartners> = {}) {
  const cjp = {
    errors: [],
    validated: true,
    ...generateJobsPartnersOfferPrivate(data),
  }
  await getDbCollection("computed_jobs_partners").insertOne(cjp)
  return cjp
}

export async function createJobPartner(data: Partial<IJobsPartnersOfferPrivate>) {
  const jp = {
    ...generateJobsPartnersOfferPrivate(data),
  }
  await getDbCollection("jobs_partners").insertOne(jp)
  return jp
}

export async function saveJobPartnerTest(data: Partial<IJobsPartnersOfferPrivate> = {}): Promise<IJobsPartnersOfferPrivate> {
  return await saveDbEntity(ZJobsPartnersOfferPrivate, (item) => getDbCollection("jobs_partners").insertOne(item), data)
}
