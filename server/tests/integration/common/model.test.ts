import { describe, expect, it } from "vitest"

import { useMongo } from "@tests/utils/mongo.test.utils"

import { createIndexes } from "../../../src/common/utils/mongodbUtils"

describe("createMongoDBIndexes", () => {
  useMongo()

  it("should create indexes for all models", { timeout: 20_000 }, async () => {
    await expect(createIndexes()).resolves.toBeUndefined()
  })
})
