import { Readable } from "node:stream"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { importFromStreamInJson } from "./import-from-stream-in-json"
import { JobPartnersGuardrailError } from "./jobs-partners-guardrails"

vi.mock("@/common/utils/sentry-utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/utils/sentry-utils")>()),
  sentryCaptureException: vi.fn(),
}))

useMongo()

const destinationCollection = "raw_decathlon" as const
const previousImportDate = new Date("2026-10-01T00:00:00.000Z")

const importJson = (content: string) =>
  importFromStreamInJson({
    stream: Readable.from([Buffer.from(content)]),
    destinationCollection,
    partnerLabel: "Decathlon",
    getOffers: (json) => json as object[],
  })

const rawReferences = async () => (await getDbCollection(destinationCollection).find({}).toArray()).map((doc) => doc.reference).sort()

describe("importFromStreamInJson", () => {
  beforeEach(async () => {
    await getDbCollection(destinationCollection).insertMany(["ancienne_1", "ancienne_2"].map((reference) => ({ _id: new ObjectId(), createdAt: previousImportDate, reference })))
    return async () => {
      await getDbCollection(destinationCollection).deleteMany({})
    }
  })

  it("remplace le lot précédent quand l'import réussit", async () => {
    await expect(importJson(JSON.stringify([{ reference: "nouvelle_1" }]))).resolves.toEqual({ offerInsertCount: 1 })

    expect(await rawReferences()).toEqual(["nouvelle_1"])
  })

  it("un tableau JSON vide fait échouer l'import et conserve le raw précédent", async () => {
    await expect(importJson("[]")).rejects.toThrow(JobPartnersGuardrailError)

    expect(await rawReferences()).toEqual(["ancienne_1", "ancienne_2"])
  })

  it("un JSON illisible fait échouer l'import et conserve le raw précédent", async () => {
    await expect(importJson('[{"reference": "tronquee"')).rejects.toThrow("erreur lors de l'import Decathlon")

    expect(await rawReferences()).toEqual(["ancienne_1", "ancienne_2"])
  })
})
