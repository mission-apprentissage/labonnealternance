import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getDbCollection } from "@/common/utils/mongodb-utils"
import { notifyToSlack } from "@/common/utils/slack-utils"
import { classifyAndRecordInBackground } from "./jobs-partners-moderation.service"
import { sendMistralMessages } from "./mistralai/mistralai.service"

vi.mock("./mistralai/mistralai.service", () => ({ sendMistralMessages: vi.fn() }))
vi.mock("@/common/utils/slack-utils")

useMongo()

const texts = { job_description: "Texte libre de l'offre", job_employer_description: null }

const classifyInBackground = async (jobId: ObjectId) => {
  classifyAndRecordInBackground({ jobId, trigger: "creation", texts, originalText: texts })
  await vi.waitFor(async () => expect(await getDbCollection("jobs_partners_moderations").countDocuments({ job_id: jobId })).toBe(1))
}

describe("classification sans blocage (LBA_MODERATION_ENFORCE à false)", () => {
  beforeEach(() => {
    vi.mocked(notifyToSlack).mockReset()
    vi.mocked(sendMistralMessages).mockReset()
  })

  it("alerte quand le classifieur est indisponible, une fois par heure au plus", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(null)

    await classifyInBackground(new ObjectId())
    await vi.waitFor(() => expect(notifyToSlack).toHaveBeenCalledTimes(1))
    await classifyInBackground(new ObjectId())
    // Laisse à la seconde classification le temps d'alerter à tort.
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(notifyToSlack).toHaveBeenCalledTimes(1)
    expect(notifyToSlack).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining("Classifieur indisponible au dépôt") }))
  })

  it("n'alerte pas sur un verdict", async () => {
    vi.mocked(sendMistralMessages).mockResolvedValue(JSON.stringify({ verdict: "conforme", findings: [] }))

    await classifyInBackground(new ObjectId())
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(notifyToSlack).not.toHaveBeenCalled()
  })
})
