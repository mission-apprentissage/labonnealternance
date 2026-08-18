import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateSearchItemFixture } from "shared/fixtures/search-items.fixture"
import { beforeAll, describe, expect, it, vi } from "vitest"
import * as mongodbUtils from "@/common/utils/mongodb-utils"
import { createSearchIndexes, getDbCollection } from "@/common/utils/mongodb-utils"
import * as sentryUtils from "@/common/utils/sentry-utils"
import { searchItems } from "@/services/search/search.service"

/**
 * Repli sans fuzzy ni synonymes quand mongot dépasse maxClauseCount=1024 (#5153) : le premier
 * fix (plafond de 12 termes) n'avait aucun effet (la requête fautive en prod ne comptait que
 * 6 termes) ; le deuxième (désactiver seulement le fuzzy) non plus (même requête, retry sans
 * fuzzy toujours en échec 31ms plus tard en prod). Diagnostic confirmé en isolant chaque
 * clause contre mongot : la clause `phrase`+`synonyms` sur la requête entière (buildTextGate)
 * suffit À ELLE SEULE à dépasser la limite sur une requête longue et riche en mots courants
 * (intitulé de formation complet), indépendamment du fuzzy et du nombre de termes — et mongot
 * n'expose aucun réglage pour relever la limite. `searchItems` retente désormais la même
 * requête avec le fuzzy ET les synonymes désactivés au lieu de renvoyer un 500.
 *
 * ⚠️ Nécessite mongot (sidecar MongoDB Search), comme search-result.test.ts — gated :
 *   SEARCH_RELEVANCE_TESTS=true yarn vitest run src/services/search/search.service.test.ts
 */
const RUN_RELEVANCE = process.env.SEARCH_RELEVANCE_TESTS === "true"

const CORPUS = [generateSearchItemFixture()]

async function seedCorpus() {
  await getDbCollection("search_items").insertMany(CORPUS)
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

// Intercepte les appels `aggregate` sur search_items pour simuler un échec mongot précis,
// sans toucher au reste (les autres appels passent par le vrai driver / la vraie stack locale).
function mockFirstAggregateCallToFail(errorMessage: string) {
  const getDbCollectionOriginal = mongodbUtils.getDbCollection
  let aggregateCalls = 0
  return vi.spyOn(mongodbUtils, "getDbCollection").mockImplementation((name) => {
    const collection = getDbCollectionOriginal(name)
    if (name !== "search_items") return collection
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
      "MongoServerError: Executor error during aggregate command on namespace: labonnealternance.search_items :: caused by :: maxClauseCount is set to 1024"
    )

    const result = await searchItems({ q: "développeur", radius: 30, page: 0, hitsPerPage: 10 })

    expect(result.hits.length).toBeGreaterThan(0)
    expect(sentrySpy).toHaveBeenCalledTimes(1)
    expect(sentrySpy).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ level: "warning" }))

    sentrySpy.mockRestore()
    getDbCollectionSpy.mockRestore()
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
      "MongoServerError: Executor error during aggregate command on namespace: labonnealternance.search_items :: caused by :: maxClauseCount is set to 1024"
    )

    // "de la le en" : uniquement des stopwords → tokenizeQuery(q) = [] côté couverture, mais la
    // clause synonymes opère sur le q brut (pas sur `terms`) donc `gate` n'était pas null avant
    // repli. En repli (synonymes retirées, coverage déjà vide), should:[] devait renvoyer null.
    const result = await searchItems({ q: "de la le en", radius: 30, page: 0, hitsPerPage: 10 })

    expect(result).toBeDefined()
    expect(sentrySpy).toHaveBeenCalledTimes(1)

    sentrySpy.mockRestore()
    getDbCollectionSpy.mockRestore()
  })
})
