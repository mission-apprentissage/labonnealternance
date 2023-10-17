import path from "path"

import { describe, it, expect } from "vitest"

import __dirname from "@/common/dirname"
import { createMongoDBIndexes } from "@/common/model"
import { mongooseInstance } from "@/common/mongodb"
import { useMongo } from "@tests/utils/mongo.utils"

describe("createMongoDBIndexes", () => {
  useMongo()

  it("should create indexes for all models", async () => {
    await expect(createMongoDBIndexes()).resolves.toBeUndefined()
  })

  it("should load all schemas", async () => {
    const names = mongooseInstance.modelNames()

    // Load all schemas found in our application
    await import(path.join(__dirname(import.meta.url), "..", "..", "..", "src", "commands"))

    // If this test fail, make sure the schema is imported in @/common/model/index
    expect(names).toEqual(mongooseInstance.modelNames())
  })
})
