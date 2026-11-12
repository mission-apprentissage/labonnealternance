import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobs-partners-computed.model"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { blockJobsPartnersWithNaf85 } from "./block-jobs-partners-with-naf85"

describe("blockJobsPartnersWithNaf85", () => {
  useMongo()

  const blockedCodes = async (codes: string[]) => {
    await givenSomeComputedJobPartners(codes.map((workplace_naf_code) => ({ workplace_naf_code, partner_job_id: workplace_naf_code, business_error: null })))
    await blockJobsPartnersWithNaf85({})
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    return jobs.filter((job) => job.business_error === JOB_PARTNER_BUSINESS_ERROR.CFA).map((job) => job.workplace_naf_code)
  }

  it("bloque la division 85 sauf 85.10Y, filtre exécuté par MongoDB", async () => {
    const blocked = await blockedCodes(["85.59A", "85.59G", "8559G", "85.10Z", "85.11Y", "85.10Y", "8510Y", "88.91A", "58.50Z"])
    expect(blocked.sort()).toEqual(["85.10Z", "85.11Y", "85.59A", "85.59G", "8559G"])
  })
})
