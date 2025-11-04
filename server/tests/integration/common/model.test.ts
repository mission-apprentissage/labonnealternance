import { describe, expect, it } from "vitest"

import { createIndexes } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"


describe("createMongoDBIndexes", () => {
  useMongo()

  it("should create indexes for all models", { timeout: 20_000 }, async () => {
    await expect(createIndexes()).resolves.toBeUndefined()
  })
})
