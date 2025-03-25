import { ObjectId } from "bson"
import { parisFixture, levalloisFixture, clichyFixture } from "shared/fixtures/referentiel/commune.fixture"
import { IGeoPoint } from "shared/models/index"
import { expect, describe, it, vi, beforeEach } from "vitest"

import { getCommuneParCodeDepartement, getDepartements, IGeoApiCommune } from "@/common/apis/geoApiGouv/geoApiGouv"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { updateReferentielCommune, getNearestCommuneByGeoPoint } from "./commune.referentiel.service"

vi.mock("@/common/apis/geoApiGouv/geoApiGouv")

useMongo()

describe("Commune Referentiel Service", () => {
  describe("updateReferentielCommune", () => {
    it("should update the referentiel.communes collection", async () => {
      const departements = [
        {
          code: "75",
          codeRegion: "11",
          nom: "Paris",
        },
        {
          nom: "Hauts-de-Seine",
          code: "92",
          codeRegion: "11",
        },
      ]

      vi.mocked(getDepartements).mockResolvedValue(departements)
      vi.mocked(getCommuneParCodeDepartement).mockImplementation(async (code: string): Promise<IGeoApiCommune[]> => {
        switch (code) {
          case "75":
            return [parisFixture]
          case "92":
            return [levalloisFixture, clichyFixture]
          default:
            return []
        }
      })

      const result = await updateReferentielCommune()
      expect(result).to.equal(0)
      expect(getDepartements).toHaveBeenCalledTimes(1)
      expect(getCommuneParCodeDepartement).toHaveBeenCalledTimes(2)
      expect(getCommuneParCodeDepartement).toHaveBeenCalledWith("75")
      expect(getCommuneParCodeDepartement).toHaveBeenCalledWith("92")
      expect(await getDbCollection("referentiel.communes").find().toArray()).toEqual(
        expect.arrayContaining([expect.objectContaining(parisFixture), expect.objectContaining(levalloisFixture), expect.objectContaining(clichyFixture)])
      )
    })
  })

  describe("getNearestCommuneByGeoPoint", () => {
    beforeEach(async () => {
      await getDbCollection("referentiel.communes").insertMany([
        { _id: new ObjectId(), ...parisFixture },
        { _id: new ObjectId(), ...levalloisFixture },
        { _id: new ObjectId(), ...clichyFixture },
      ])
    })

    it("should return the nearest commune for a given geo point", async () => {
      const pointWithinClichy: IGeoPoint = {
        type: "Point",
        coordinates: [2.2986396, 48.9001407],
      }

      const commune = await getNearestCommuneByGeoPoint(pointWithinClichy)
      expect(commune).toEqual(expect.objectContaining(clichyFixture))
    })

    it("should return the nearest commune for a given geo point even if the point is outside the commune", async () => {
      const porteDeClichy: IGeoPoint = {
        type: "Point",
        coordinates: [2.313262, 48.894891],
      }

      const commune = await getNearestCommuneByGeoPoint(porteDeClichy)
      expect(commune).toEqual(expect.objectContaining(clichyFixture))
    })
  })
})
