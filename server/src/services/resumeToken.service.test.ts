//@copilot generate test for resumeToken.service.ts
import { CollectionName } from "shared/models/models"
import { IResumeTokenData } from "shared/models/resumeTokens.model"
import { beforeEach, describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { useMongo } from "@tests/utils/mongo.test.utils"

import { getResumeToken, storeResumeToken } from "./resumeToken.service"

useMongo()

describe("Resume Token Service", () => {
  beforeEach(async () => {
    await getDbCollection("resumetokens").deleteMany({})
  })
  it("should store and retrieve a resume token", async () => {
    const collectionName: CollectionName = "recruiters"

    const resumeTokenData: IResumeTokenData = { _data: "test_token_data" }

    await storeResumeToken(collectionName, resumeTokenData)
    const storedToken = await getResumeToken(collectionName)

    expect(storedToken).toBeDefined()
    expect(storedToken?.collection).toBe(collectionName)
    expect(storedToken?.resumeTokenData._data).toBe(resumeTokenData._data)
  })

  it("should return null if no resume token exists for the collection", async () => {
    const nonExistentCollection: CollectionName = "anonymized_recruiters"
    const storedToken = await getResumeToken(nonExistentCollection)

    expect(storedToken).toBeNull()
  })
})
