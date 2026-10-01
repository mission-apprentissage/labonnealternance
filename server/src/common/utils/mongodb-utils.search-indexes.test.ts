import { useMongo } from "@tests/utils/mongo.test.utils"
import searchSuggestionsModel from "shared/models/search-suggestions.model"
import { afterEach, describe, expect, it } from "vitest"
import { createSearchIndexes, getDbCollection } from "@/common/utils/mongodb-utils"

/**
 * ⚠️ Nécessite mongot, comme search-result.test.ts — gated :
 *   SEARCH_RELEVANCE_TESTS=true yarn test server/src/common/utils/mongodb-utils.search-indexes.test.ts
 */
const RUN_RELEVANCE = process.env.SEARCH_RELEVANCE_TESTS === "true"

const [declared] = searchSuggestionsModel.searchIndexes

const suggestionsIndexVersion = async () => {
  const [index] = (await getDbCollection("search_suggestions").listSearchIndexes(declared.name).toArray()) as { latestDefinitionVersion?: { version: number } }[]
  return index?.latestDefinitionVersion?.version
}

async function waitForIndex(timeoutMs = 60_000) {
  const start = Date.now()
  while ((await suggestionsIndexVersion()) === undefined) {
    if (Date.now() - start > timeoutMs) throw new Error("mongot n'a pas créé search_suggestions_index")
    await new Promise((resolve) => setTimeout(resolve, 1_000))
  }
}

describe.runIf(RUN_RELEVANCE)("createSearchIndexes", () => {
  useMongo()

  afterEach(() => {
    ;(searchSuggestionsModel.searchIndexes as unknown as unknown[])[0] = declared
  })

  it("ne relance pas le build d'un index dont la définition n'a pas changé", { timeout: 90_000 }, async () => {
    await createSearchIndexes()
    await waitForIndex()
    const before = await suggestionsIndexVersion()

    await createSearchIndexes()

    expect(await suggestionsIndexVersion()).toBe(before)
  })

  it("met à jour un index dont la définition a changé", { timeout: 90_000 }, async () => {
    await createSearchIndexes()
    await waitForIndex()
    const before = await suggestionsIndexVersion()
    const changed = {
      ...declared,
      definition: { mappings: { ...declared.definition.mappings, fields: { ...declared.definition.mappings.fields, normalized: { type: "token" } } } },
    }
    ;(searchSuggestionsModel.searchIndexes as unknown as unknown[])[0] = changed

    await createSearchIndexes()

    expect(await suggestionsIndexVersion()).toBe((before ?? 0) + 1)
  })
})
