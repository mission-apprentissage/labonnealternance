import { useMongo } from "@tests/utils/mongo.test.utils"
import { describe, expect, it } from "vitest"

import { createIndexes } from "../../../src/common/utils/mongodbUtils"

describe("createMongoDBIndexes", () => {
  useMongo()

  it(
    "should create indexes for all models",
    async () => {
      await expect(createIndexes()).resolves.toBeUndefined()
    },
    { timeout: 20_000 }
  )

  it(
    "should load all schemas",
    async () => {
      // TODO
    },
    { timeout: 20_000 }
  )
})
