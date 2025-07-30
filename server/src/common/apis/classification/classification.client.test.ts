import nock from "nock"
import { generateJobsPartnersFull } from "shared/fixtures/jobPartners.fixture"
import { IClassificationLabResponse } from "shared/models/cacheClassification.model"
import { describe, expect, it, vi } from "vitest"

import { nockLabClassification } from "@/common/apis/classification/classification.client.fixture"
import { getClassificationFromLab, TJobClassification } from "@/services/cacheClassification.service"
import { useMongo } from "@tests/utils/mongo.test.utils"

useMongo()

vi.mock("@/common/utils/sentryUtils")

describe("getLabClassification", () => {
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
  const apiPayload = [jobFixture.workplace_name, jobFixture.workplace_description, jobFixture.offer_title, jobFixture.offer_description].filter(Boolean).join("\n")
  const apiResponse: IClassificationLabResponse = { label: "cfa", model: "model", scores: { cfa: 0.5, entreprise: 0.4, entreprise_cfa: 0.2 }, text: "Software Engineer" }

  it("should request labonnealternance lab for a classification", async () => {
    nockLabClassification(apiPayload, apiResponse)

    expect(await getClassificationFromLab(payload)).toEqual(apiResponse.label)
    expect(nock.isDone()).toBe(true)
  })
})
