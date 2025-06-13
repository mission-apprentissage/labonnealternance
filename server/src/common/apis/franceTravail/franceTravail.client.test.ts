import { ObjectId } from "mongodb"
import nock from "nock"
import { describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { searchForFtJobs } from "./franceTravail.client"
import { generateFtJobFixture, nockFranceTravailOffreSearch, nockFranceTravailTokenAccessOffre } from "./franceTravail.client.fixture"

useMongo()

vi.mock("@/common/utils/sentryUtils")

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
