import { describe, expect, it, vi } from "vitest"

import { sendMistralMessages } from "@/services/mistralai/mistralai.service"
import type { IGetLabClassificationBatch } from "./classification.client"
import { CLASSIFICATION_MISTRAL_MODEL, getMistralClassificationBatch } from "./classification-mistral.client"

vi.mock("@/services/mistralai/mistralai.service", () => ({
  sendMistralMessages: vi.fn(),
}))

vi.mock("@/common/utils/sentry-utils")

describe("getMistralClassificationBatch", () => {
  const jobs: IGetLabClassificationBatch = [{ id: "0", workplace_name: "CFA Test", offer_title: "Développeur" }]

  it("parses a valid Mistral response and injects the model", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue('{"results":[{"id":"0","label":"unpublish","scores":{"publish":0.2,"unpublish":0.8}}]}')

    const result = await getMistralClassificationBatch(jobs)

    expect(result).toEqual([{ id: "0", label: "unpublish", scores: { publish: 0.2, unpublish: 0.8 }, model: `mistral:${CLASSIFICATION_MISTRAL_MODEL}` }])
  })

  it("retries once when sendMistralMessages returns null, then succeeds", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValueOnce(null).mockResolvedValueOnce('{"results":[{"id":"0","label":"publish","scores":{"publish":0.9,"unpublish":0.1}}]}')

    const result = await getMistralClassificationBatch(jobs)

    expect(sendMistralMessages).toHaveBeenCalledTimes(2)
    expect(result[0].label).toBe("publish")
  }, 10_000)

  it("throws after a persistent failure (no content after retry)", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(null)

    await expect(getMistralClassificationBatch(jobs)).rejects.toThrow()
  }, 10_000)

  it("throws on invalid JSON without retrying", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue("pas du json")

    await expect(getMistralClassificationBatch(jobs)).rejects.toThrow()
    expect(sendMistralMessages).toHaveBeenCalledTimes(1)
  })

  it("throws when a requested id is missing from the response", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue('{"results":[{"id":"other-id","label":"publish","scores":{"publish":0.9,"unpublish":0.1}}]}')

    await expect(getMistralClassificationBatch(jobs)).rejects.toThrow()
  })
})
