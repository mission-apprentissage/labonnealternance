import nock from "nock"
import { describe, expect, it } from "vitest"

import { getJobEtudiantJobs } from "./etudiant.client"
import { generateJobEtudiantJobFixture, nockJobEtudiantNextPage, nockJobEtudiantPage } from "./etudiant.client.fixture"
import config from "@/config"

describe("getJobEtudiantJobs", () => {
  it("should return jobs from a single page", async () => {
    const job = generateJobEtudiantJobFixture()
    nockJobEtudiantPage({ jobs: [job] })

    const result = await getJobEtudiantJobs()

    expect(result).toEqual([job])
    expect(nock.isDone()).toBe(true)
  })

  it("should paginate through multiple pages and aggregate all results", async () => {
    const job1 = generateJobEtudiantJobFixture({ public_id: "job-1" })
    const job2 = generateJobEtudiantJobFixture({ public_id: "job-2" })
    const nextPageToken = "token-abc-123"

    nockJobEtudiantPage({ "next-page": nextPageToken, jobs: [job1] })
    nockJobEtudiantNextPage(nextPageToken, { jobs: [job2] })

    const result = await getJobEtudiantJobs()

    expect(result).toEqual([job1, job2])
    expect(nock.isDone()).toBe(true)
  })

  it("should paginate through an encoded next-page token", async () => {
    const job1 = generateJobEtudiantJobFixture({ public_id: "job-1" })
    const job2 = generateJobEtudiantJobFixture({ public_id: "job-2" })
    const nextPageToken = "cursor%3Dpage%252F2%26sort%3Ddesc"

    nockJobEtudiantPage({ "next-page": nextPageToken, jobs: [job1] })
    nockJobEtudiantNextPage(nextPageToken, { jobs: [job2] })

    const result = await getJobEtudiantJobs()

    expect(result).toEqual([job1, job2])
    expect(nock.isDone()).toBe(true)
  })

  it("should return an empty array when jobs is empty", async () => {
    nockJobEtudiantPage({ jobs: [] })

    const result = await getJobEtudiantJobs()

    expect(result).toEqual([])
    expect(nock.isDone()).toBe(true)
  })

  it("should throw when the response does not match the expected schema", async () => {
    const { origin, pathname, search } = new URL(config.job_etudiant.url)
    nock(origin).get(`${pathname}${search}`).reply(200, { invalid: "response" })

    await expect(getJobEtudiantJobs()).rejects.toThrow()
  })

  it("should throw on API error", async () => {
    const { origin, pathname, search } = new URL(config.job_etudiant.url)
    nock(origin).get(`${pathname}${search}`).reply(401, "Unauthorized")

    await expect(getJobEtudiantJobs()).rejects.toThrow()
  })
})
