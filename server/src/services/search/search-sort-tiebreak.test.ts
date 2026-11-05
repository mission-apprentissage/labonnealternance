import { useMongo } from "@tests/utils/mongo.test.utils"
import { generateSearchItemFixture } from "shared/fixtures/search-items.fixture"
import type { ISearchItem } from "shared/models/index"
import { beforeAll, describe, expect, it } from "vitest"
import { createSearchIndexes, getDbCollection } from "@/common/utils/mongodb-utils"
import type { SearchMode } from "@/services/search/search.service"
import { searchItems } from "@/services/search/search.service"
import { getSearchCorpusCollection } from "@/services/search/search-items.service"

// Départage du tri par défaut à score égal (#5836). Nécessite mongot, cf. search-result.test.ts.
// Tous les documents d'un mode ont le même titre et les mêmes rome_labels, donc le même score.
const RUN_RELEVANCE = process.env.SEARCH_RELEVANCE_TESTS === "true"

const doc = (url_id: string, smart_apply: boolean | null, application_count: number, data: Partial<ISearchItem>) =>
  generateSearchItemFixture({ url_id, smart_apply, application_count, title: "Boulanger", rome_labels: ["Boulangerie"], keywords: [], ...data })

const WITH_TRAINING = { is_formation_included: true }
const TRAINING = { type: "formation" as const, type_filter_label: "Formation" }

const CORPUS = [
  doc("ef-null-5", null, 5, WITH_TRAINING),
  doc("ef-false-5", false, 5, WITH_TRAINING),
  doc("ef-true-0", true, 0, WITH_TRAINING),
  doc("ef-true-5", true, 5, WITH_TRAINING),
  doc("emp-false-5", false, 5, {}),
  doc("emp-false-0", false, 0, {}),
  doc("emp-true-0", true, 0, {}),
  doc("emp-true-5", true, 5, {}),
  doc("form-null-0", null, 0, TRAINING),
  doc("form-true-5", true, 5, TRAINING),
]

const COLLECTION_BY_MODE = { emplois: "search_jobs", emplois_formation: "search_jobs_with_training", formations: "search_trainings" } as const
const countOf = (mode: SearchMode) => CORPUS.filter((d) => getSearchCorpusCollection(d) === COLLECTION_BY_MODE[mode]).length

async function seedCorpus() {
  for (const d of CORPUS) await getDbCollection(getSearchCorpusCollection(d)).insertOne(d)
}

const search = (mode: SearchMode, q: string | undefined, page = 0, hitsPerPage = 10) => searchItems({ mode, radius: 30, page, hitsPerPage, ...(q ? { q } : {}) })

const ids = async (...args: Parameters<typeof search>) => (await search(...args)).hits.map((h) => h.url_id)

async function waitForSearchIndexSync(timeoutMs = 120_000) {
  const start = Date.now()
  for (;;) {
    const synced = await Promise.all(
      (["emplois", "emplois_formation", "formations"] as const).map(async (mode) => (await search(mode, undefined).catch(() => null))?.nbHits === countOf(mode))
    )
    if (synced.every(Boolean)) return
    if (Date.now() - start > timeoutMs) throw new Error("mongot n'a pas indexé le corpus — la stack locale (mongodb + mongot) tourne-t-elle ?")
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }
}

describe.runIf(RUN_RELEVANCE)("tri par défaut — départage à score égal", () => {
  useMongo(seedCorpus, "beforeAll")

  beforeAll(async () => {
    await createSearchIndexes()
    await waitForSearchIndexSync()
  }, 150_000)

  describe.each([
    ["avec q", "boulanger"],
    ["sans q", undefined],
  ])("%s", (_label, q) => {
    it("emplois_formation : smart_apply d'abord, puis moins de candidatures, null en dernier", async () => {
      expect(await ids("emplois_formation", q)).toEqual(["ef-true-0", "ef-true-5", "ef-false-5", "ef-null-5"])
    })

    // Page 1 : la page 0 du mode emplois est réordonnée par promoteSmartApplyHits.
    it("emplois : les offres sans smart_apply suivent les offres smart_apply", async () => {
      expect(await ids("emplois", q, 1, 2)).toEqual(["emp-false-0", "emp-false-5"])
    })

    it("formations : null ne passe pas devant true", async () => {
      expect(await ids("formations", q)).toEqual(["form-true-5", "form-null-0"])
    })
  })
})
