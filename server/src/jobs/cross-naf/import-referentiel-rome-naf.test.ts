import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { afterEach, describe, expect, it, vi } from "vitest"
import { s3ReadAsString } from "@/common/utils/aws-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { importReferentielRomeNaf } from "./import-referentiel-rome-naf"

vi.mock("@/common/utils/aws-utils", () => ({
  s3ReadAsString: vi.fn(),
}))

const buildRow = (overrides: Record<string, unknown> = {}) => ({
  rome: "A1101",
  rome_libelle: "Conducteur / Conductrice d'engins agricoles",
  naf: "0161Z",
  naf_libelle: "Activités de soutien aux cultures",
  rang: 1,
  contrats_par_annee: [
    { annee: 2025, n_contrats: 317 },
    { annee: 2026, n_contrats: 69 },
  ],
  ...overrides,
})

const mockFile = (rows: unknown) => vi.mocked(s3ReadAsString).mockResolvedValueOnce(JSON.stringify(rows))

const findAll = () =>
  getDbCollection("referentiel_rome_naf")
    .find({}, { projection: { _id: 0, created_at: 0, updated_at: 0 } })
    .sort({ rome: 1, rang: 1 })
    .toArray()

describe("importReferentielRomeNaf", () => {
  useMongo()

  afterEach(() => {
    vi.mocked(s3ReadAsString).mockReset()
  })

  it("importe le fichier S3 en normalisant le code NAF au format INSEE", async () => {
    mockFile([buildRow(), buildRow({ naf: "01.11Z", naf_libelle: "Culture de céréales", rang: 2 })])

    const counters = await importReferentielRomeNaf()

    expect(s3ReadAsString).toHaveBeenCalledWith("storage", "cross_naf/naf_par_rome.json")
    expect(counters).toEqual({ total: 2, upserted: 2, modified: 0, deleted: 0 })
    expect(await findAll()).toEqual([
      { ...buildRow(), naf: "01.61Z" },
      { ...buildRow({ naf_libelle: "Culture de céréales", rang: 2 }), naf: "01.11Z" },
    ])
  })

  it("remplace le référentiel : met à jour les couples présents et supprime ceux absents du fichier", async () => {
    const createdAt = new Date("2026-01-01")
    await getDbCollection("referentiel_rome_naf").insertMany([
      { ...buildRow({ rang: 2, contrats_par_annee: [] }), naf: "01.61Z", _id: new ObjectId(), created_at: createdAt, updated_at: createdAt },
      { ...buildRow({ naf_libelle: "Culture de la vigne", rang: 1 }), naf: "01.21Z", _id: new ObjectId(), created_at: createdAt, updated_at: createdAt },
    ])
    mockFile([buildRow()])

    const counters = await importReferentielRomeNaf()

    expect(counters).toEqual({ total: 1, upserted: 0, modified: 1, deleted: 1 })
    expect(await findAll()).toEqual([{ ...buildRow(), naf: "01.61Z" }])
    expect(await getDbCollection("referentiel_rome_naf").findOne({})).toMatchObject({ created_at: createdAt })
  })

  it("n'importe rien et fait échouer le job dès qu'une ligne est invalide ou en doublon", async () => {
    const existing = { ...buildRow(), naf: "01.61Z", _id: new ObjectId(), created_at: new Date(), updated_at: new Date() }
    await getDbCollection("referentiel_rome_naf").insertOne(existing)
    mockFile([
      buildRow({ naf: "0111Z", rang: 2 }),
      buildRow({ naf: "0111Z", rang: 3 }),
      buildRow({ rome: "A11", naf: "0121Z" }),
      buildRow({ naf: "01.11Z", rang: 4 }),
      buildRow({ naf: "01ABC" }),
      buildRow({ naf: "0113Z", rang: 0 }),
    ])

    await expect(importReferentielRomeNaf()).rejects.toThrow(/5\/6 ligne\(s\) rejetée\(s\)/)
    expect(await getDbCollection("referentiel_rome_naf").find({}).toArray()).toEqual([existing])
  })

  it("fait échouer le job sur un fichier vide", async () => {
    mockFile([])

    await expect(importReferentielRomeNaf()).rejects.toThrow(/n'est pas un tableau non vide/)
  })
})
