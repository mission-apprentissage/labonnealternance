import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import { generateJobsPartnersFull } from "shared/fixtures/jobPartners.fixture"
import type { IClassificationLabBatchResponse } from "shared/models/cacheClassification.model"
import { describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import type { TJobClassification } from "@/services/cacheClassification.service"
import { getClassificationFromLab } from "@/services/cacheClassification.service"
import { nockLabClassification } from "./classification.client.fixture"

useMongo()

vi.mock("@/common/utils/sentryUtils")

describe("getLabClassification - get batch classification", () => {
  const jobFixture = generateJobsPartnersFull({
    workplace_name: "CFA",
    workplace_description: "CFA",
    offer_title: "Software Engineer",
    offer_description: "Software Engineer",
  })
  const payload: TJobClassification = {
    partner_job_id: jobFixture.partner_job_id,
    partner_label: jobFixture.partner_label,
    workplace_name: jobFixture.workplace_name!,
    workplace_description: jobFixture.workplace_description!,
    offer_title: jobFixture.offer_title,
    offer_description: jobFixture.offer_description,
  }
  const apiPayload = {
    id: jobFixture.partner_job_id,
    workplace_name: jobFixture.workplace_name ?? undefined,
    workplace_description: jobFixture.workplace_description ?? undefined,
    offer_title: jobFixture.offer_title ?? undefined,
    offer_description: jobFixture.offer_description ?? undefined,
  }
  const apiResponse: IClassificationLabBatchResponse = [
    {
      id: jobFixture.partner_job_id,
      label: "unpublish",
      model: "model",
      scores: { publish: 0.4, unpublish: 0.5 },
    },
  ]

  it("should request labonnealternance lab for a classification", async () => {
    nockLabClassification([apiPayload], apiResponse)

    expect(await getClassificationFromLab([payload])).toEqual([apiResponse[0].label])
    expect(nock.isDone()).toBe(true)
  })

  it("should store model and created_at in cache when saving classification", async () => {
    const before = new Date()
    nockLabClassification([apiPayload], apiResponse)

    await getClassificationFromLab([payload])

    const cached = await getDbCollection("cache_classification").findOne({ partner_job_id: jobFixture.partner_job_id })
    expect(cached).not.toBeNull()
    expect(cached!.model).toBe("model")
    expect(cached!.created_at).toBeInstanceOf(Date)
    expect(cached!.created_at!.getTime()).toBeGreaterThanOrEqual(before.getTime())
  })
})
