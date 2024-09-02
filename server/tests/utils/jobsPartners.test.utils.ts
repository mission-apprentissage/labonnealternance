import { IJobsPartnersOfferPrivate, ZJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners, ZComputedJobsPartners } from "shared/models/jobsPartnersComputed.model "

import { getDbCollection } from "@/common/utils/mongodbUtils"

import { getFixture, saveDbEntity } from "./user.test.utils"

export async function createComputedJobPartner(data: Partial<IComputedJobsPartners>) {
  const cjp = {
    ...getFixture().fromSchema(ZComputedJobsPartners),
    ...data,
  }
  await getDbCollection("computed_jobs_partners").insertOne(cjp)
  return cjp
}

export async function createJobPartner(data: Partial<IJobsPartnersOfferPrivate>) {
  const jp = {
    ...getFixture().fromSchema(ZJobsPartnersOfferPrivate),
    ...data,
  }
  await getDbCollection("jobs_partners").insertOne(jp)
  return jp
}

export async function saveJobPartnerTest(data: Partial<IJobsPartnersOfferPrivate> = {}): Promise<IJobsPartnersOfferPrivate> {
  return await saveDbEntity(ZJobsPartnersOfferPrivate, (item) => getDbCollection("jobs_partners").insertOne(item), data)
}
