import nock from "nock"
import { describe, expect, it, vi } from "vitest"
import config from "@/config"
import { getAllEmploiInclusionJobsByDepartement } from "./emploi-inclusion.client"
import { generateEmploiInclusionJobFixture, nockEmploiInclusionNextPage, nockEmploiInclusionPage } from "./emploi-inclusion.client.fixture"

vi.mock("@/common/utils/asyncUtils", () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}))

describe("getAllEmploiInclusionJobsByDepartement", () => {
  it("should return results from a single page", async () => {
    const job = generateEmploiInclusionJobFixture()
    nockEmploiInclusionPage("75", { count: 1, next: null, previous: null, results: [job] })

    const result = await getAllEmploiInclusionJobsByDepartement("75")

    expect(result).toEqual([job])
    expect(nock.isDone()).toBe(true)
  })

  it("should paginate through multiple pages and aggregate all results", async () => {
    const job1 = generateEmploiInclusionJobFixture({ id: "497f6eca-6276-4993-bfeb-53cbbbba6f08" })
    const job2 = generateEmploiInclusionJobFixture({ id: "507f6eca-6276-4993-bfeb-53cbbbba6f09" })
    const nextUrl = `${config.emploi_inclusion.url}/api/v1/siaes/?departement=75&page=2`

    nockEmploiInclusionPage("75", { count: 2, next: nextUrl, previous: null, results: [job1] })
    nockEmploiInclusionNextPage(nextUrl, { count: 2, next: null, previous: null, results: [job2] })

    const result = await getAllEmploiInclusionJobsByDepartement("75")

    expect(result).toEqual([job1, job2])
    expect(nock.isDone()).toBe(true)
  })

  it("should return an empty array when results is empty", async () => {
    nockEmploiInclusionPage("75", { count: 0, next: null, previous: null, results: [] })

    const result = await getAllEmploiInclusionJobsByDepartement("75")

    expect(result).toEqual([])
    expect(nock.isDone()).toBe(true)
  })

  it("should throw when the response does not match the expected schema", async () => {
    nock(config.emploi_inclusion.url).get(/.*/).matchHeader("Authorization", `Token ${config.emploi_inclusion.apiKey}`).reply(200, { invalid: "response" })

    await expect(getAllEmploiInclusionJobsByDepartement("75")).rejects.toThrow()
  })

  it("should retry on 429 and return result on subsequent success", async () => {
    const job = generateEmploiInclusionJobFixture()

    nock(config.emploi_inclusion.url)
      .get("/api/v1/siaes/")
      .matchHeader("Authorization", `Token ${config.emploi_inclusion.apiKey}`)
      .query({ departement: "75", page_size: "100000" })
      .reply(429, "Too Many Requests", { "retry-after": "1" })

    nockEmploiInclusionPage("75", { count: 1, next: null, previous: null, results: [job] })

    const result = await getAllEmploiInclusionJobsByDepartement("75")

    expect(result).toEqual([job])
    expect(nock.isDone()).toBe(true)
  })

  it("should throw after exhausting all retry attempts on persistent 429", async () => {
    const nockOpts = { "retry-after": "1" }
    nock(config.emploi_inclusion.url)
      .get("/api/v1/siaes/")
      .matchHeader("Authorization", `Token ${config.emploi_inclusion.apiKey}`)
      .query({ departement: "75", page_size: "100000" })
      .reply(429, "Too Many Requests", nockOpts)
    nock(config.emploi_inclusion.url)
      .get("/api/v1/siaes/")
      .matchHeader("Authorization", `Token ${config.emploi_inclusion.apiKey}`)
      .query({ departement: "75", page_size: "100000" })
      .reply(429, "Too Many Requests", nockOpts)
    nock(config.emploi_inclusion.url)
      .get("/api/v1/siaes/")
      .matchHeader("Authorization", `Token ${config.emploi_inclusion.apiKey}`)
      .query({ departement: "75", page_size: "100000" })
      .reply(429, "Too Many Requests", nockOpts)
    nock(config.emploi_inclusion.url)
      .get("/api/v1/siaes/")
      .matchHeader("Authorization", `Token ${config.emploi_inclusion.apiKey}`)
      .query({ departement: "75", page_size: "100000" })
      .reply(429, "Too Many Requests", nockOpts)

    await expect(getAllEmploiInclusionJobsByDepartement("75")).rejects.toThrow()
  })
})
