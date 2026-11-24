import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getAllFTJobsByDepartments } from "@/common/apis/france-travail/france-travail.client"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { importFranceTravailRaw } from "./import-jobs-france-travail"

vi.mock("api-alternance-sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("api-alternance-sdk")>()),
  ApiClient: class {
    geographie = { listDepartements: async () => [{ codeInsee: "75" }, { codeInsee: "13" }] }
  },
}))

vi.mock("@/common/apis/france-travail/france-travail.client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/apis/france-travail/france-travail.client")>()),
  getAllFTJobsByDepartments: vi.fn(),
}))

useMongo()

const previousImportDate = new Date("2026-10-01T00:00:00.000Z")

const ftJob = (id: string) => ({
  id,
  intitule: "Apprenti cuisinier",
  description: "Description",
  dateCreation: "2026-10-01T00:00:00.000Z",
  lieuTravail: { libelle: "75 - Paris" },
  romeCode: "G1602",
  entreprise: {},
  typeContrat: "CDD",
  typeContratLibelle: "CDD - 24 mois",
  natureContrat: "Contrat apprentissage",
  experienceExige: "D",
  salaire: {},
  alternance: true,
  origineOffre: { origine: "1", urlOrigine: "https://candidat.francetravail.fr" },
})

const pagesByDepartement = (pages: Record<string, string[] | Error>) => {
  vi.mocked(getAllFTJobsByDepartments).mockImplementation(async function* (departement: string) {
    const page = pages[departement]
    if (page instanceof Error) throw page
    if (page?.length) yield page.map(ftJob)
  })
}

const rawState = async () =>
  Object.fromEntries((await getDbCollection("raw_francetravail").find({}).toArray()).map(({ id, unpublishedAt }) => [id, unpublishedAt ? "dépubliée" : "publiée"]))

describe("importFranceTravailRaw", () => {
  beforeEach(async () => {
    await getDbCollection("raw_francetravail").insertMany(
      [
        { id: "toujours_la", unpublishedAt: undefined },
        { id: "retiree", unpublishedAt: undefined },
        { id: "revenue", unpublishedAt: previousImportDate },
      ].map(({ id, unpublishedAt }) => ({
        ...ftJob(id),
        _id: new ObjectId(),
        createdAt: previousImportDate,
        updatedAt: previousImportDate,
        ...(unpublishedAt ? { unpublishedAt } : {}),
      }))
    )
    return async () => {
      await getDbCollection("raw_francetravail").deleteMany({})
    }
  })

  it("une erreur persistante sur un département fait échouer l'import sans marquer d'offre dépubliée", async () => {
    pagesByDepartement({ "75": ["toujours_la"], "13": new Error("france-travail: échec de récupération des offres (dept: 13, tentative 4/4)") })

    await expect(importFranceTravailRaw()).rejects.toThrow("dept: 13")

    expect(await rawState()).toEqual({ toujours_la: "publiée", retiree: "publiée", revenue: "dépubliée" })
  })

  it("aucune offre récupérée fait échouer l'import sans marquer d'offre dépubliée", async () => {
    pagesByDepartement({ "75": [], "13": [] })

    await expect(importFranceTravailRaw()).rejects.toThrow("aucune offre importée")

    expect(await rawState()).toEqual({ toujours_la: "publiée", retiree: "publiée", revenue: "dépubliée" })
  })

  it("un import complet dépublie les offres non revues et republie celles qui réapparaissent", async () => {
    pagesByDepartement({ "75": ["toujours_la"], "13": ["revenue"] })

    await expect(importFranceTravailRaw()).resolves.toEqual({ count: 2 })

    expect(await rawState()).toEqual({ toujours_la: "publiée", retiree: "dépubliée", revenue: "publiée" })
  })
})
