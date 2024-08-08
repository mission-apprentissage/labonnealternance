import { IJobsPartners } from "shared/models/jobsPartners.model"
import { describe, expect, it } from "vitest"

import { ApiApprentissageTokenData, getApiApprentissageTestingToken } from "../../../src/security/accessApiApprentissageService"
import { useMongo } from "../../utils/mongo.utils"
import { useServer } from "../../utils/server.utils"
import { createJobParnter } from "../../utils/user.utils"

describe("/jobs", () => {
  let dataset: { rome_code: string[]; latitude: number; longitude: number; diploma: string }
  const tokenPayload: ApiApprentissageTokenData = {
    email: "test@test.fr",
  }
  const token = getApiApprentissageTestingToken(tokenPayload)

  const mockData = async () => {
    const result = (await createJobParnter()) as IJobsPartners
    const [longitude, latitude] = result.workplace.location.geopoint.coordinates
    dataset = {
      longitude,
      latitude,
      rome_code: result.job_offer!.rome_code,
      diploma: result.job_offer!.diploma_level_label!,
    }
  }

  useMongo(mockData, "beforeAll")

  describe("/rome", () => {
    const httpClient = useServer()
    it("should return 401 if no api key provided", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/rome" })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })
    it("should return 401 if no api key is invalid", async () => {
      const response = await httpClient().inject({ method: "GET", path: "/api/v2/jobs/rome", headers: { authorization: `Bearer ${token}invalid` } })
      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ statusCode: 401, error: "Unauthorized", message: "Unauthorized" })
    })
    it("should perform search and return data", async () => {
      const { rome_code, latitude, longitude, diploma } = dataset
      const romes = rome_code.join(",")
      const response = await httpClient().inject({
        method: "GET",
        path: `/api/v2/jobs/rome?romes=${romes}&latitude=${latitude}&longitude=${longitude}&diploma=${diploma}`,
        headers: { authorization: `Bearer ${token}` },
      })
      console.log(response)
    })
  })
})
