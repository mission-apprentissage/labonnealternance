import { ObjectId } from "mongodb"
import nock from "nock"
import { describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { sentryCaptureException } from "@/common/utils/sentryUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { getRomeoPredictions, searchForFtJobs } from "./franceTravail.client"
import {
  franceTravailRomeoFixture,
  generateFtJobFixture,
  nockFranceTravailOffreSearch,
  nockFranceTravailRomeo,
  nockFranceTravailTokenAccessOffre,
  nockFranceTravailTokenAccessRomeo,
} from "./franceTravail.client.fixture"

useMongo()

vi.mock("@/common/utils/sentryUtils")

describe("getRomeoPredictions", () => {
  const payload = [{ intitule: "Software Engineer", identifiant: "1", contexte: " " }]

  it("should request romeo predictions", async () => {
    nockFranceTravailTokenAccessRomeo()
    nockFranceTravailRomeo(payload, franceTravailRomeoFixture["Software Engineer"])

    expect(await getRomeoPredictions(payload)).toEqual(franceTravailRomeoFixture["Software Engineer"])
    expect(nock.isDone()).toBe(true)
    expect(await getDbCollection("francetravail_access").find().toArray()).toEqual([
      { _id: expect.any(ObjectId), access_token: "ft_token_romeo", access_type: "ROMEO", created_at: expect.any(Date) },
    ])
  })

  it("should return null in case of error from romeo API", async () => {
    nockFranceTravailTokenAccessRomeo()

    expect(await getRomeoPredictions(payload)).toEqual(null)
    expect(nock.isDone()).toBe(true)
    expect(sentryCaptureException).toHaveBeenCalledTimes(1)
  })

  it("should throw an error if the payload is too big", async () => {
    const payload = Array.from({ length: 51 }, (_, i) => ({ intitule: `Software Engineer ${i}`, identifiant: `${i}`, contexte: " " }))

    await expect(getRomeoPredictions(payload)).rejects.toThrowError("Maximum recommanded array size is 50")
  })

  it("should not request new token if the token exists in cache", async () => {
    await getDbCollection("francetravail_access").insertOne({
      _id: new ObjectId(),
      access_token: "ft_token_romeo",
      access_type: "ROMEO",
      created_at: new Date(),
    })

    nockFranceTravailRomeo(payload, franceTravailRomeoFixture["Software Engineer"])

    expect(await getRomeoPredictions(payload)).toEqual(franceTravailRomeoFixture["Software Engineer"])
    expect(nock.isDone()).toBe(true)
  })

  it("should error if the token cannot be retrieved", async () => {
    // Not the expected access type
    await getDbCollection("francetravail_access").insertOne({
      _id: new ObjectId(),
      access_token: "ft_token_offres",
      access_type: "OFFRE",
      created_at: new Date(),
    })

    await expect(getRomeoPredictions(payload)).rejects.toThrowError("impossible d'obtenir un token pour l'API france travail")
  })
})

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
      { resultats: jobs } //
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
