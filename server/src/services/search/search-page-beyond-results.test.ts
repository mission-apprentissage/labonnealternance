import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateSearchItemFixture } from "shared/fixtures/search-items.fixture"
import { beforeAll, describe, expect, it } from "vitest"
import { createSearchIndexes, getDbCollection } from "@/common/utils/mongodb-utils"
import { searchItems } from "@/services/search/search.service"

// nbHits et nbPages d'une page située après la dernière (#6063). Nécessite mongot, cf. search-result.test.ts.
const RUN_RELEVANCE = process.env.SEARCH_RELEVANCE_TESTS === "true"

const ORGANIZATIONS = ["Fournil A", "Fournil A", "Fournil A", "Fournil B", "Fournil B"]
const BOULANGERS = ORGANIZATIONS.map((organization_name, i) =>
  generateSearchItemFixture({ url_id: `boulanger-${i}`, title: "Boulanger", rome_labels: ["Boulangerie"], keywords: [], organization_name })
)
// Sans géopoint : compté par les facettes, écarté par l'opérateur `near` du tri par proximité.
const { location: _location, ...SANS_LOCATION } = generateSearchItemFixture({ url_id: "patissier", title: "Pâtissier", rome_labels: ["Pâtisserie"], keywords: [] })
const CORPUS = [...BOULANGERS, SANS_LOCATION]
const PARIS = { latitude: 48.8566, longitude: 2.3522 }

async function seedCorpus() {
  await getDbCollection("search_jobs").insertMany(CORPUS)
}

const search = (filters: Partial<Parameters<typeof searchItems>[0]> = {}) => searchItems({ q: "boulanger", radius: 30, page: 0, hitsPerPage: 2, ...filters })

const totals = async (filters: Parameters<typeof search>[0]) => {
  const { hits, nbHits, nbPages } = await search(filters)
  return { hits: hits.length, nbHits, nbPages }
}

async function waitForSearchIndexSync(timeoutMs = 120_000) {
  const start = Date.now()
  for (;;) {
    if ((await search({ q: undefined }).catch(() => null))?.nbHits === CORPUS.length) return
    if (Date.now() - start > timeoutMs) throw new Error("mongot n'a pas indexé le corpus — la stack locale (mongodb + mongot) tourne-t-elle ?")
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }
}

describe.runIf(RUN_RELEVANCE)("searchItems — page située après la dernière", () => {
  useMongo(seedCorpus, "beforeAll")

  beforeAll(async () => {
    await createSearchIndexes()
    await waitForSearchIndexSync()
  }, 150_000)

  describe("recherche sans résultat : nbHits reste à 0", () => {
    it("sans filtre", async () => {
      expect(await totals({ q: "plombier", page: 3 })).toEqual({ hits: 0, nbHits: 0, nbPages: 0 })
    })

    it("en page 0, quand les facettes comptent un document que la recherche écarte", async () => {
      const result = await search({ q: "pâtissier", ...PARIS, admin_area: "departement:75", sort: "proximity" })

      expect(result.facets?.type).toEqual({ offre: 1 })
      expect({ hits: result.hits.length, nbHits: result.nbHits, nbPages: result.nbPages }).toEqual({ hits: 0, nbHits: 0, nbPages: 0 })
    })

    // La facette d'une dimension filtrée est calculée sans son filtre : elle compte des documents
    // que la recherche ne renvoie pas.
    it("avec un filtre de dimension dont la facette n'est pas vide", async () => {
      const result = await search({ organization_name: "Fournil C", page: 1 })

      expect(result.facets?.organization_name).toEqual({ "Fournil A": 3, "Fournil B": 2 })
      expect({ hits: result.hits.length, nbHits: result.nbHits, nbPages: result.nbPages }).toEqual({ hits: 0, nbHits: 0, nbPages: 0 })
    })
  })

  describe("recherche avec résultats", () => {
    it("renvoie le total et le nombre de pages de la recherche", async () => {
      expect(await totals({ page: 3 })).toEqual({ hits: 0, nbHits: 5, nbPages: 3 })
    })

    it("nbHits égal à page × hitsPerPage", async () => {
      expect(await totals({ page: 1, hitsPerPage: 5 })).toEqual({ hits: 0, nbHits: 5, nbPages: 1 })
    })

    it("compte les seuls documents du filtre de dimension actif", async () => {
      expect(await totals({ organization_name: "Fournil A", page: 2 })).toEqual({ hits: 0, nbHits: 3, nbPages: 2 })
    })

    it("tri par proximité : même total qu'en page 0", async () => {
      const proximity = { ...PARIS, sort: "proximity" as const }

      expect(await totals({ ...proximity, page: 0 })).toEqual({ hits: 2, nbHits: 5, nbPages: 3 })
      expect(await totals({ ...proximity, page: 3 })).toEqual({ hits: 0, nbHits: 5, nbPages: 3 })
    })

    it("laisse inchangée la dernière page", async () => {
      expect(await totals({ page: 2 })).toEqual({ hits: 1, nbHits: 5, nbPages: 3 })
    })
  })
})
