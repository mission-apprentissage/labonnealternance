import nock from "nock"
import type { IClassificationLabBatchResponse } from "shared/models/cacheClassification.model"
import { COMPUTED_ERROR_SOURCE } from "shared/models/jobsPartnersComputed.model"
import { beforeEach, describe, expect, it } from "vitest"

import { detectClassificationJobsPartners as detectClassificationJobsPartnersRaw } from "./detectClassificationJobsPartners"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import config from "@/config"
import { givenSomeComputedJobPartners } from "@tests/fixture/givenSomeComputedJobPartners"
import { useMongo } from "@tests/utils/mongo.test.utils"

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
        label: "entreprise",
        model: "model",
        scores: { cfa: 0.5, entreprise: 0.4, entreprise_cfa: 0.2 },
        text: "Software Engineer",
      },
    ]
    nock(config.labonnealternanceLab.baseUrl).post("/scores").reply(200, apiResponse)
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
})
