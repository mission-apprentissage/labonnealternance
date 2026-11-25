import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateSearchItemFixture } from "shared/fixtures/search-items.fixture"
import { beforeAll, describe, expect, it, vi } from "vitest"
import * as mongodbUtils from "@/common/utils/mongodb-utils"
import { createSearchIndexes, getDbCollection } from "@/common/utils/mongodb-utils"
import * as sentryUtils from "@/common/utils/sentry-utils"
import { resolveSearchMode, searchItems, tokenizeQuery } from "@/services/search/search.service"

/**
 * Repli sans fuzzy ni synonymes quand mongot dépasse maxClauseCount=1024 (#5153). Ni un plafond
 * de termes (la requête fautive en prod n'en comptait que 6) ni le retrait du seul fuzzy ne
 * suffisent : la clause `phrase`+`synonyms` sur la requête entière (buildTextGate) dépasse à elle
 * seule la limite sur une requête longue riche en mots courants, et mongot n'expose aucun réglage
 * pour la relever.
 *
 * ⚠️ Nécessite mongot (sidecar MongoDB Search), comme search-result.test.ts — gated :
 *   SEARCH_RELEVANCE_TESTS=true yarn vitest run src/services/search/search.service.test.ts
 */
const RUN_RELEVANCE = process.env.SEARCH_RELEVANCE_TESTS === "true"

const CORPUS = [generateSearchItemFixture()]

async function seedCorpus() {
  await getDbCollection("search_jobs").insertMany(CORPUS)
}

async function waitForSearchIndexSync(timeoutMs = 120_000) {
  const start = Date.now()
  for (;;) {
    try {
      const { nbHits } = await searchItems({ radius: 30, page: 0, hitsPerPage: 1 })
      if (nbHits >= CORPUS.length) return
    } catch {
      // index pas encore créé côté mongot → on réessaie
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`mongot n'a pas indexé le corpus en ${timeoutMs}ms — la stack locale (mongodb + mongot) tourne-t-elle ?`)
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }
}

// Intercepte les appels `aggregate` sur search_jobs (corpus du mode par défaut) pour simuler un échec mongot précis,
// sans toucher au reste (les autres appels passent par le vrai driver / la vraie stack locale).
function mockFirstAggregateCallToFail(errorMessage: string) {
  const getDbCollectionOriginal = mongodbUtils.getDbCollection
  let aggregateCalls = 0
  return vi.spyOn(mongodbUtils, "getDbCollection").mockImplementation((name) => {
    const collection = getDbCollectionOriginal(name)
    if (name !== "search_jobs") return collection
    return new Proxy(collection, {
      get(target, prop, receiver) {
        if (prop === "aggregate") {
          return (...args: Parameters<typeof collection.aggregate>) => {
            aggregateCalls++
            if (aggregateCalls === 1) {
              return { toArray: () => Promise.reject(new Error(errorMessage)) }
            }
            return target.aggregate(...args)
          }
        }
        const value = Reflect.get(target, prop, receiver)
        return typeof value === "function" ? value.bind(target) : value
      },
    }) as typeof collection
  })
}

describe.runIf(RUN_RELEVANCE)("searchItems — repli sans fuzzy ni synonymes sur maxClauseCount dépassé", () => {
  useMongo(seedCorpus, "beforeAll")

  beforeAll(async () => {
    await createSearchIndexes()
    await waitForSearchIndexSync()
  })

  it("retente sans fuzzy ni synonymes et renvoie un résultat au lieu de propager l'erreur", async () => {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: test
    const sentrySpy = vi.spyOn(sentryUtils, "sentryCaptureException").mockImplementation(() => {})
    const getDbCollectionSpy = mockFirstAggregateCallToFail(
      "MongoServerError: Executor error during aggregate command on namespace: labonnealternance.search_jobs :: caused by :: maxClauseCount is set to 1024"
    )

    const result = await searchItems({ q: "développeur", radius: 30, page: 0, hitsPerPage: 10 })

    expect(result.hits.length).toBeGreaterThan(0)
    expect(sentrySpy).toHaveBeenCalledTimes(1)
    expect(sentrySpy).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ level: "warning" }))

    sentrySpy.mockRestore()
    getDbCollectionSpy.mockRestore()
  })

  it("garde le total de la recherche sur une page située après la dernière", async () => {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: test
    const sentrySpy = vi.spyOn(sentryUtils, "sentryCaptureException").mockImplementation(() => {})
    const getDbCollectionSpy = mockFirstAggregateCallToFail(
      "MongoServerError: Executor error during aggregate command on namespace: labonnealternance.search_jobs :: caused by :: maxClauseCount is set to 1024"
    )

    try {
      const result = await searchItems({ q: "développeur", radius: 30, page: 1, hitsPerPage: 10 })

      expect({ hits: result.hits.length, nbHits: result.nbHits, nbPages: result.nbPages, degraded: result.degraded }).toEqual({
        hits: 0,
        nbHits: CORPUS.length,
        nbPages: 1,
        degraded: true,
      })
    } finally {
      sentrySpy.mockRestore()
      getDbCollectionSpy.mockRestore()
    }
  })

  it("propage sans repli une erreur qui n'est pas liée à maxClauseCount", async () => {
    const getDbCollectionSpy = mockFirstAggregateCallToFail("connection reset")

    await expect(searchItems({ q: "développeur", radius: 30, page: 0, hitsPerPage: 10 })).rejects.toThrow("connection reset")

    getDbCollectionSpy.mockRestore()
  })

  it("ne construit pas un compound should:[] quand le repli désactive les synonymes sur un q réduit à des stopwords (retour Copilot)", async () => {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: test
    const sentrySpy = vi.spyOn(sentryUtils, "sentryCaptureException").mockImplementation(() => {})
    const getDbCollectionSpy = mockFirstAggregateCallToFail(
      "MongoServerError: Executor error during aggregate command on namespace: labonnealternance.search_jobs :: caused by :: maxClauseCount is set to 1024"
    )

    // "de la le en" : uniquement des stopwords → tokenizeQuery(q) = [] côté couverture, mais la
    // clause synonymes opère sur le q brut (pas sur `terms`) donc `gate` n'est pas null avant
    // repli. En repli (synonymes retirées, coverage déjà vide), should:[] doit renvoyer null.
    const result = await searchItems({ q: "de la le en", radius: 30, page: 0, hitsPerPage: 10 })

    expect(result).toBeDefined()
    expect(sentrySpy).toHaveBeenCalledTimes(1)

    sentrySpy.mockRestore()
    getDbCollectionSpy.mockRestore()
  })
})

type Pipeline = Array<{ $search?: { compound: object }; $searchMeta?: { compound?: object; facet?: object } }>

/**
 * Remplace mongot par des réponses fixes : `rows` pour la requête $search, `total` pour un
 * $searchMeta de comptage sur le compound de cette requête, 0 pour les autres comptages.
 * Les pipelines émis sont rendus pour inspection.
 */
function mockSearchAggregations({ rows, total }: { rows: object[]; total: number }) {
  const pipelines: Pipeline[] = []
  const spy = vi.spyOn(mongodbUtils, "getDbCollection").mockImplementation(
    () =>
      ({
        aggregate: (pipeline: Pipeline) => {
          pipelines.push(pipeline)
          const [{ $search, $searchMeta }] = pipeline
          if ($search) return { toArray: async () => rows }
          if ($searchMeta?.facet) return { toArray: async () => [{ facet: {} }] }
          const mainCompound = pipelines.find(([stage]) => stage.$search)?.[0].$search?.compound
          const isMainCompound = JSON.stringify($searchMeta?.compound) === JSON.stringify(mainCompound)
          return { toArray: async () => [{ count: { total: isMainCompound ? total : 0 } }] }
        },
      }) as never
  )
  const totalCounts = () => {
    const mainCompound = pipelines.find(([stage]) => stage.$search)?.[0].$search?.compound
    return pipelines.filter(([stage]) => stage.$searchMeta?.compound && JSON.stringify(stage.$searchMeta.compound) === JSON.stringify(mainCompound)).length
  }
  return { spy, totalCounts }
}

const row = (total: number) => ({ ...generateSearchItemFixture(), highlights: [], _meta: { count: { total } } })

describe("searchItems — total d'une page sans ligne (#6063)", () => {
  const run = async (aggregations: Parameters<typeof mockSearchAggregations>[0], page: number) => {
    const { spy, totalCounts } = mockSearchAggregations(aggregations)
    try {
      const { hits, nbHits, nbPages } = await searchItems({ q: "boulanger", radius: 30, page, hitsPerPage: 20 })
      return { hits: hits.length, nbHits, nbPages, totalCounts: totalCounts() }
    } finally {
      spy.mockRestore()
    }
  }

  it("page 0 : aucun comptage émis, une page sans ligne vaut 0 résultat", async () => {
    expect(await run({ rows: [], total: 25 }, 0)).toEqual({ hits: 0, nbHits: 0, nbPages: 0, totalCounts: 0 })
  })

  it("page ≥ 1 sans ligne : total du comptage sur le compound de la recherche", async () => {
    expect(await run({ rows: [], total: 25 }, 2)).toEqual({ hits: 0, nbHits: 25, nbPages: 2, totalCounts: 1 })
  })

  it("page ≥ 1 sans ligne d'une recherche sans résultat : 0", async () => {
    expect(await run({ rows: [], total: 0 }, 2)).toEqual({ hits: 0, nbHits: 0, nbPages: 0, totalCounts: 1 })
  })

  it("page ≥ 1 avec lignes : total porté par les lignes", async () => {
    expect(await run({ rows: [row(41)], total: 99 }, 2)).toEqual({ hits: 1, nbHits: 41, nbPages: 3, totalCounts: 1 })
  })
})

describe("tokenizeQuery", () => {
  it("retire les mots vides et les mots de diplôme par défaut (clé d'agrégation de search_queries)", () => {
    expect(tokenizeQuery("BTS MCO en alternance")).toEqual(["mco"])
  })

  it("diplomaWords : ne garde que les mots de diplôme", () => {
    expect(tokenizeQuery("Licence pro commerce", { diplomaWords: true })).toEqual(["licence", "pro"])
  })

  it("diplomaWords : near-miss, un mot qui contient un mot de diplôme n'en est pas un", () => {
    expect(tokenizeQuery("capitaine boulanger", { diplomaWords: true })).toEqual([])
  })
})

describe("resolveSearchMode", () => {
  it.each([
    [{}, "emplois"],
    [{ type: "offre" }, "emplois"],
    [{ type: "formation" }, "formations"],
    [{ mode: "emplois_formation" as const, type: "formation" }, "emplois_formation"],
  ])("%j → %s", (filters, mode) => {
    expect(resolveSearchMode(filters)).toBe(mode)
  })
})
