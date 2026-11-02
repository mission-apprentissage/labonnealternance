import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import nock from "nock"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { sleep } from "@/common/utils/async-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { sentryCaptureException } from "@/common/utils/sentry-utils"
import { FT_SEARCH_MAX_ATTEMPTS, FT_SEARCH_RETRY_DELAY_MS, getAllFTJobsByDepartments, searchForFtJobs } from "./france-travail.client"
import { generateFtJobFixture, nockFranceTravailOffreSearch, nockFranceTravailTokenAccessOffre } from "./france-travail.client.fixture"

useMongo()

vi.mock("@/common/utils/sentry-utils")
vi.mock("@/common/utils/async-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/utils/async-utils")>()),
  sleep: vi.fn(async () => undefined),
}))

describe("searchForFtJobs", () => {
  const jobs = [generateFtJobFixture({})]

  it("should execute the search", async () => {
    nockFranceTravailTokenAccessOffre()
    nockFranceTravailOffreSearch(
      {
        codeROME: "M1602",
        commune: "75101",
        sort: "2",
        natureContrat: "E2,FS",
        range: "0-149",
        distance: "30",
        partenaires: "LABONNEALTERNANCE",
        modeSelectionPartenaires: "EXCLU",
      },
      { resultats: jobs }
    )

    expect(
      await searchForFtJobs(
        {
          codeROME: "M1602",
          commune: "75101",
          sort: 2,
          natureContrat: "E2,FS",
          range: "0-149",
          distance: 30,
        },
        { throwOnError: true }
      )
    ).toEqual({ data: { resultats: jobs }, contentRange: undefined })
    expect(nock.isDone()).toBe(true)
    expect(await getDbCollection("francetravail_access").find().toArray()).toEqual([
      { _id: expect.any(ObjectId), access_token: "ft_token_offre", access_type: "OFFRE", created_at: expect.any(Date) },
    ])
  })

  it("should use token from cache if it exists", async () => {
    await getDbCollection("francetravail_access").insertOne({
      _id: new ObjectId(),
      access_token: "ft_token_offre",
      access_type: "OFFRE",
      created_at: new Date(),
    })

    nockFranceTravailOffreSearch(
      {
        sort: "2",
        natureContrat: "E2,FS",
        range: "0-149",
        partenaires: "LABONNEALTERNANCE",
        modeSelectionPartenaires: "EXCLU",
      },
      { resultats: jobs } //  contentRange: "offres 0-149/12114"
    )

    expect(
      await searchForFtJobs(
        {
          sort: 2,
          natureContrat: "E2,FS",
          range: "0-149",
        },
        { throwOnError: true }
      )
    ).toEqual({ data: { resultats: jobs }, contentRange: undefined })
    expect(nock.isDone()).toBe(true)
  })

  describe("when throwOnError is false", () => {
    it("should throw if the access token cannot be retrieved", async () => {
      await expect(searchForFtJobs({ sort: 2, natureContrat: "E2,FS", range: "0-149" }, { throwOnError: false })).rejects.toThrowError(
        "impossible d'obtenir un token pour l'API france travail"
      )
    })

    it("should return null if the request fails", async () => {
      nockFranceTravailTokenAccessOffre()
      await expect(searchForFtJobs({ sort: 2, natureContrat: "E2,FS", range: "0-149" }, { throwOnError: false })).resolves.toBeNull()
      expect(sentryCaptureException).toHaveBeenCalledTimes(1)
    })
  })

  describe("when throwOnError is true", () => {
    it("should throw if the access token cannot be retrieved", async () => {
      await expect(searchForFtJobs({ sort: 2, natureContrat: "E2,FS", range: "0-149" }, { throwOnError: true })).rejects.toThrowError(
        "impossible d'obtenir un token pour l'API france travail"
      )
    })

    it("should throw if the request fails", async () => {
      nockFranceTravailTokenAccessOffre()
      await expect(searchForFtJobs({ sort: 2, natureContrat: "E2,FS", range: "0-149" }, { throwOnError: true })).rejects.toThrow()
      expect(sentryCaptureException).toHaveBeenCalledTimes(0)
    })
  })
})

describe("getAllFTJobsByDepartments", () => {
  const searchParams = { natureContrat: "E2,FS", range: "0-149", departement: "75", sort: "1", partenaires: "LABONNEALTERNANCE", modeSelectionPartenaires: "EXCLU" }
  const nockSearchFailure = (times: number) =>
    nock("https://api.francetravail.io/partenaire").get("/offresdemploi/v2/offres/search").query(searchParams).times(times).reply(500, { message: "Erreur technique" })

  const collect = async () => {
    const pages: unknown[][] = []
    for await (const jobs of getAllFTJobsByDepartments("75")) {
      pages.push(jobs)
    }
    return pages
  }

  beforeEach(async () => {
    vi.mocked(sleep).mockClear()
    await getDbCollection("francetravail_access").insertOne({ _id: new ObjectId(), access_token: "ft_token_offre", access_type: "OFFRE", created_at: new Date() })
    return () => {
      nock.cleanAll()
    }
  })

  it("retente une erreur passagère avec un délai croissant puis reprend la pagination", async () => {
    const jobs = [generateFtJobFixture({})]
    nockSearchFailure(2)
    nockFranceTravailOffreSearch(searchParams, { resultats: jobs })

    await expect(collect()).resolves.toEqual([jobs])
    expect(vi.mocked(sleep).mock.calls.map(([ms]) => ms)).toEqual([FT_SEARCH_RETRY_DELAY_MS, 2 * FT_SEARCH_RETRY_DELAY_MS, 1500])
  })

  it("une erreur persistante fait échouer la récupération après un nombre borné de tentatives", async () => {
    nockSearchFailure(FT_SEARCH_MAX_ATTEMPTS)

    await expect(collect()).rejects.toThrow(`tentative ${FT_SEARCH_MAX_ATTEMPTS}/${FT_SEARCH_MAX_ATTEMPTS}`)
    expect(nock.isDone()).toBe(true)
  })
})
