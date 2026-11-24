import { Readable } from "node:stream"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { beforeEach, describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { importFromStreamInCsv } from "./import-from-stream-in-csv"
import { JobPartnersGuardrailError } from "./jobs-partners-guardrails"

useMongo()

const destinationCollection = "raw_leboncoin" as const
const previousImportDate = new Date("2026-10-01T00:00:00.000Z")

const importCsv = (content: string) =>
  importFromStreamInCsv({
    stream: Readable.from([Buffer.from(content)]),
    destinationCollection,
    partnerLabel: "Leboncoin",
    parseOptions: { delimiter: "," },
  })

const rawReferences = async () => (await getDbCollection(destinationCollection).find({}).toArray()).map((doc) => (doc.job as { reference: string }).reference).sort()

describe("importFromStreamInCsv", () => {
  beforeEach(async () => {
    await getDbCollection(destinationCollection).insertMany(
      ["ancienne_1", "ancienne_2"].map((reference) => ({ _id: new ObjectId(), createdAt: previousImportDate, job: { reference } }))
    )
    return async () => {
      await getDbCollection(destinationCollection).deleteMany({})
    }
  })

  it("remplace le lot précédent quand l'import réussit", async () => {
    await expect(importCsv("reference,title\nnouvelle_1,Vendeur\n")).resolves.toEqual({ offerInsertCount: 1 })

    expect(await rawReferences()).toEqual(["nouvelle_1"])
  })

  it("un CSV vide fait échouer l'import et conserve le raw précédent", async () => {
    await expect(importCsv("")).rejects.toThrow(JobPartnersGuardrailError)

    expect(await rawReferences()).toEqual(["ancienne_1", "ancienne_2"])
  })

  it("un CSV réduit à son en-tête fait échouer l'import et conserve le raw précédent", async () => {
    await expect(importCsv("reference,title\n")).rejects.toThrow("aucune offre importée")

    expect(await rawReferences()).toEqual(["ancienne_1", "ancienne_2"])
  })
})
