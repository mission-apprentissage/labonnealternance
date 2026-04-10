import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import type { IClassificationLabBatchResponse } from "shared/models/cacheClassification.model"
import { COMPUTED_ERROR_SOURCE, JOB_PARTNER_BUSINESS_ERROR } from "shared/models/jobsPartnersComputed.model"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"
import { GEIQ_WHITELIST } from "./geiqWhitelist"
import { detectClassificationJobsPartners as detectClassificationJobsPartnersRaw } from "./detectClassificationJobsPartners"

const detectClassificationJobsPartners = async () => detectClassificationJobsPartnersRaw({ shouldNotifySlack: false })

const offer_title = "vendeur / vendeuse"
const workplace_name = "decathlon"
const workplace_description = "description d'un magasin decathlon"
const offer_description = "description d'une offre de vendeur"
const partner_job_id = "partner_job_id"

describe("detectClassificationJobsPartners", () => {
  useMongo()

  beforeEach(() => {
    const apiResponse: IClassificationLabBatchResponse = [
      {
        id: partner_job_id,
        label: "publish",
        model: "model",
        scores: { publish: 0.6, unpublish: 0.4 },
      },
    ]
    nock(config.labonnealternanceLab.baseUrl).post("/model/scores").reply(200, apiResponse)
    return async () => {
      await getDbCollection("computed_jobs_partners").deleteMany({})
    }
  })

  it("should pass on a job partner with all fields", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        offer_title,
        workplace_name,
        workplace_description,
        offer_description,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })

  it("should pass on a job partner with only a title", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        offer_title,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })
  it("should pass on a job partner with only a workplace name", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        workplace_name,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })
  it("should pass on a job partner with only a workplace description", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        workplace_description,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })
  it("should pass on a job partner with only an offer description", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        offer_description,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })

  it("should set business_error to CFA when classification is 'unpublish'", async () => {
    // given
    nock.cleanAll()
    const unpublishResponse: IClassificationLabBatchResponse = [
      {
        id: partner_job_id,
        label: "unpublish",
        model: "model",
        scores: { publish: 0.3, unpublish: 0.7 },
      },
    ]
    nock(config.labonnealternanceLab.baseUrl).post("/model/scores").reply(200, unpublishResponse)
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        offer_title,
        workplace_name,
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.business_error).toEqual(JOB_PARTNER_BUSINESS_ERROR.CFA)
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(true)
  })

  it("should NOT classify an offer from a company in the GEIQ whitelist", async () => {
    // given
    await givenSomeComputedJobPartners([
      {
        partner_job_id,
        offer_title,
        workplace_name,
        workplace_siret: GEIQ_WHITELIST[0],
      },
    ])
    // when
    await detectClassificationJobsPartners()
    // then
    const jobs = await getDbCollection("computed_jobs_partners").find({}).toArray()
    expect.soft(jobs.length).toEqual(1)
    const [job] = jobs
    expect.soft(job.jobs_in_success.includes(COMPUTED_ERROR_SOURCE.CLASSIFICATION)).toEqual(false)
  })
})
