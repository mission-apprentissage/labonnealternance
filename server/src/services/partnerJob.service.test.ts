import { ObjectId } from "mongodb"
import { generateJobsPartnersOfferPrivate } from "shared/fixtures/jobPartners.fixture"
import { levalloisFixture, marseilleFixture, parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { getPartnerJobById, getPartnerJobs } from "./partnerJob.service"

useMongo()

describe("partnerJob.service", () => {
  const partnerJobs: IJobsPartnersOfferPrivate[] = [
    generateJobsPartnersOfferPrivate({
      _id: new ObjectId("675209e704377be3d437bbb9"),
      offer_rome_codes: ["M1602"],
      workplace_geopoint: parisFixture.centre,
      offer_creation: new Date("2021-01-01"),
      partner_job_id: "job-id-1",
    }),
    generateJobsPartnersOfferPrivate({
      _id: new ObjectId("67520b753761274f55ee1dbb"),
      offer_rome_codes: ["M1602", "D1214"],
      workplace_geopoint: marseilleFixture.centre,
      offer_creation: new Date("2022-01-01"),
      partner_job_id: "job-id-2",
    }),
    generateJobsPartnersOfferPrivate({
      _id: new ObjectId("67520b8db04d1ef4ff79e1e5"),
      offer_rome_codes: ["D1212"],
      workplace_geopoint: levalloisFixture.centre,
      offer_creation: new Date("2023-01-01"),
      partner_job_id: "job-id-3",
    }),
  ]

  beforeEach(async () => {
    await getDbCollection("jobs_partners").insertMany(partnerJobs)
    return async () => {
      await getDbCollection("jobs_partners").deleteMany({})
    }
  })

  it("should execute query with minimalData", async () => {
    const results = await getPartnerJobs({
      longitude: parisFixture.centre.coordinates[0],
      latitude: parisFixture.centre.coordinates[1],
      radius: 30,
      romes: "M1602",
      isMinimalData: true,
      api: "jobV1/jobs",
    })

    expect(results).toMatchSnapshot()
  })

  it("should return empty array if no match", async () => {
    const results = await getPartnerJobs({
      longitude: parisFixture.centre.coordinates[0],
      latitude: parisFixture.centre.coordinates[1],
      radius: 30,
      romes: "K1602",
      isMinimalData: true,
      api: "jobV1/jobs",
    })

    expect(results).toEqual({
      results: [],
    })
  })

  it("should execute query with full data", async () => {
    const results = await getPartnerJobs({
      longitude: parisFixture.centre.coordinates[0],
      latitude: parisFixture.centre.coordinates[1],
      radius: 30,
      romes: "M1602",
      isMinimalData: false,
      api: "jobV1/jobs",
    })

    expect(results).toMatchSnapshot()
  })

  it("should find offer by id", async () => {
    const results = await getPartnerJobById({
      id: new ObjectId("67520b8db04d1ef4ff79e1e5"),
      caller: "lba",
    })

    expect(results).toMatchSnapshot()
  })

  it("should return not_found when offer id is not correct", async () => {
    const results = await getPartnerJobById({
      id: new ObjectId("67520b8db04d1ef4ff79e177"),
      caller: "lba",
    })

    expect(results).toEqual({
      error: "not_found",
    })
  })
})
