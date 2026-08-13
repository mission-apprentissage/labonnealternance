import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "bson"
import { generateJobsPartnersFull } from "shared/fixtures/job-partners.fixture"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getMistralClassificationBatch } from "@/common/apis/classification/classification-mistral.client"
import { getDbCollection } from "@/common/utils/mongodb-utils"

import { compareLabAndMistralAgainstHumanVerification } from "./compare-lab-mistral-classification.service"

vi.mock("@/common/apis/classification/classification-mistral.client", () => ({
  getMistralClassificationBatch: vi.fn(),
}))

vi.mock("@/common/utils/sentry-utils")

const insertHumanVerifiedEntry = async ({
  classification,
  human_verification,
  suffix,
}: {
  classification: "publish" | "unpublish"
  human_verification: "publish" | "unpublish"
  suffix: string
}) => {
  const job = generateJobsPartnersFull({ partner_job_id: `job-${suffix}`, partner_label: "un partenaire" })
  await getDbCollection("jobs_partners").insertOne(job)
  await getDbCollection("cache_classification").insertOne({
    _id: new ObjectId(),
    partner_label: job.partner_label,
    partner_job_id: job.partner_job_id,
    classification,
    human_verification,
    scores: { publish: 0.5, unpublish: 0.5 },
    model: "lab-v2",
    created_at: new Date(),
  })
  return job
}

const mistralResponseFor = (labels: ("publish" | "unpublish")[]) =>
  labels.map((label, index) => ({
    id: index.toString(),
    label,
    scores: { publish: label === "publish" ? 0.9 : 0.1, unpublish: label === "publish" ? 0.1 : 0.9 },
    model: "mistral:test",
  }))

describe("compareLabAndMistralAgainstHumanVerification", () => {
  useMongo()

  beforeEach(async () => {
    vi.clearAllMocks()
    await getDbCollection("cache_classification").deleteMany({})
    await getDbCollection("jobs_partners").deleteMany({})
  })

  it("construit la matrice de confusion Lab/Mistral contre la vérité terrain humaine", async () => {
    // A: lab correct, mistral correct — B: lab faux, mistral correct — C: les deux faux — D: lab correct, mistral faux
    await insertHumanVerifiedEntry({ classification: "publish", human_verification: "publish", suffix: "a" })
    await insertHumanVerifiedEntry({ classification: "publish", human_verification: "unpublish", suffix: "b" })
    await insertHumanVerifiedEntry({ classification: "unpublish", human_verification: "publish", suffix: "c" })
    await insertHumanVerifiedEntry({ classification: "unpublish", human_verification: "unpublish", suffix: "d" })
    vi.mocked(getMistralClassificationBatch).mockResolvedValue(mistralResponseFor(["publish", "unpublish", "unpublish", "publish"]))

    const result = await compareLabAndMistralAgainstHumanVerification()

    expect(result.total).toBe(4)
    expect(result.labCorrect).toBe(2)
    expect(result.mistralCorrect).toBe(2)
    expect(result.bothCorrect).toBe(1)
    expect(result.bothWrong).toBe(1)
    expect(result.onlyLabCorrect).toBe(1)
    expect(result.onlyMistralCorrect).toBe(1)
    expect(result.labAccuracy).toBe(0.5)
    expect(result.mistralAccuracy).toBe(0.5)
    // Lab se trompe sur B et C (classification !== human_verification) ; Mistral n'en rattrape
    // indépendamment que B (celui où son propre label matche human_verification).
    expect(result.knownLabErrors).toBe(2)
    expect(result.knownLabErrorsCaughtByMistral).toBe(1)
    expect(result.knownLabErrorCatchRate).toBe(0.5)
  })

  it("découpe en lots de 50 (vrai batching Mistral, pas un appel par offre)", async () => {
    for (let i = 0; i < 60; i++) {
      await insertHumanVerifiedEntry({ classification: "publish", human_verification: "publish", suffix: `bulk-${i}` })
    }
    vi.mocked(getMistralClassificationBatch).mockImplementation(async (jobs) => mistralResponseFor(jobs.map(() => "publish" as const)))

    const result = await compareLabAndMistralAgainstHumanVerification()

    expect(result.total).toBe(60)
    expect(getMistralClassificationBatch).toHaveBeenCalledTimes(2)
    expect(vi.mocked(getMistralClassificationBatch).mock.calls[0][0]).toHaveLength(50)
    expect(vi.mocked(getMistralClassificationBatch).mock.calls[1][0]).toHaveLength(10)
  })

  it("ignore un lot en échec sans interrompre la comparaison", async () => {
    for (let i = 0; i < 60; i++) {
      await insertHumanVerifiedEntry({ classification: "publish", human_verification: "publish", suffix: `bulk-${i}` })
    }
    vi.mocked(getMistralClassificationBatch)
      .mockRejectedValueOnce(new Error("mistral down"))
      .mockImplementationOnce(async (jobs) => mistralResponseFor(jobs.map(() => "publish" as const)))

    const result = await compareLabAndMistralAgainstHumanVerification()

    expect(result.total).toBe(10)
    expect(result.mistralCallFailures).toBe(50)
    expect(result.mistralCorrect).toBe(10)
  })

  it("respecte la limite demandée via --limit", async () => {
    for (let i = 0; i < 10; i++) {
      await insertHumanVerifiedEntry({ classification: "publish", human_verification: "publish", suffix: `limit-${i}` })
    }
    vi.mocked(getMistralClassificationBatch).mockImplementation(async (jobs) => mistralResponseFor(jobs.map(() => "publish" as const)))

    const result = await compareLabAndMistralAgainstHumanVerification({ limit: 3 })

    expect(result.total).toBe(3)
  })
})
