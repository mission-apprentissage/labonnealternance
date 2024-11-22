import { ObjectId } from "mongodb"
import { TrafficType } from "shared/models"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { hashEmail, saveApplicationTrafficSourceIfAny, saveUserTrafficSourceIfAny } from "./trafficSource.service"

useMongo()

describe("Recording traffic source", () => {
  beforeEach(async () => {
    return async () => {
      await getDbCollection("trafficsources").deleteMany({})
    }
  })

  it("Le hash est consistant", async () => {
    const result1 = hashEmail("test@test.com")
    const result2 = hashEmail("test@test.com")
    const result3 = hashEmail("autre_test@test.com")

    expect.soft(result1).toEqual(result2)
    expect.soft(result1).not.toEqual(result3)
  })

  it("Un sourceTracking est enregistré si referer", async () => {
    const application_id = new ObjectId()
    await saveApplicationTrafficSourceIfAny({
      application_id,
      applicant_email: "test@test.com",
      source: {
        referer: "referer1",
        utm_campaign: null,
        utm_medium: null,
        utm_source: null,
      },
    })

    const result = await getDbCollection("trafficsources").findOne({ application_id })

    expect.soft(result).toEqual(
      expect.objectContaining({
        referer: "referer1",
        utm_campaign: null,
        utm_medium: null,
        utm_source: null,
        applicant_email_hash: hashEmail("test@test.com"),
        user_id: null,
        traffic_type: TrafficType.APPLICATION,
      })
    )
  })

  it("Un sourceTracking est enregistré si utm_campaign", async () => {
    const user_id_entreprise = new ObjectId()
    await saveUserTrafficSourceIfAny({
      user_id: user_id_entreprise,
      type: TrafficType.ENTREPRISE,
      source: {
        referer: null,
        utm_campaign: "campaign",
        utm_medium: "medium",
        utm_source: "source",
      },
    })

    const user_id_cfa = new ObjectId()
    await saveUserTrafficSourceIfAny({
      user_id: user_id_cfa,
      type: TrafficType.CFA,
      source: {
        referer: "referer2",
        utm_campaign: "campaign",
        utm_medium: "medium",
        utm_source: "source",
      },
    })

    const resultEntreprise = await getDbCollection("trafficsources").findOne({ user_id: user_id_entreprise })

    expect.soft(resultEntreprise).toEqual(
      expect.objectContaining({
        referer: null,
        utm_campaign: "campaign",
        utm_medium: "medium",
        utm_source: "source",
        traffic_type: TrafficType.ENTREPRISE,
        applicant_email_hash: null,
        user_id: user_id_entreprise,
      })
    )

    const resultCfa = await getDbCollection("trafficsources").findOne({ user_id: user_id_cfa })

    expect.soft(resultCfa).toEqual(
      expect.objectContaining({
        referer: "referer2",
        utm_campaign: "campaign",
        utm_medium: "medium",
        utm_source: "source",
        applicant_email_hash: null,
        traffic_type: TrafficType.CFA,
        user_id: user_id_cfa,
      })
    )
  })

  it("Aucun sourcetracking enregistré si ni referer ni campaign", async () => {
    const application_id = new ObjectId()

    const countBefore = await getDbCollection("trafficsources").countDocuments({})

    await saveApplicationTrafficSourceIfAny({
      application_id,
      applicant_email: "test@test.com",
      source: {
        referer: null,
        utm_campaign: null,
        utm_medium: null,
        utm_source: null,
      },
    })

    const countAfter = await getDbCollection("trafficsources").countDocuments({})

    const result = await getDbCollection("trafficsources").findOne({ application_id })

    expect.soft(countBefore).toEqual(countAfter)
    expect.soft(result).toEqual(null)
  })
})
