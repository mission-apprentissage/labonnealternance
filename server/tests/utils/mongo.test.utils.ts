import { modelDescriptors } from "shared/models/models"
import { afterAll, beforeAll, beforeEach } from "vitest"

import { clearAllCollections, closeMongodbConnection, configureDbSchemaValidation, connectToMongodb, createIndexes } from "@/common/utils/mongodbUtils"
import config from "@/config"

export const startAndConnectMongodb = async () => {
  const workerId = `${process.env.VITEST_POOL_ID}-${process.env.VITEST_WORKER_ID}`

  await connectToMongodb(config.mongodb.uri.replace("VITEST_POOL_ID", workerId))
  await Promise.all([createIndexes(), configureDbSchemaValidation(modelDescriptors)])
}

export const stopMongodb = async () => {
  await closeMongodbConnection()
}

type MockData = () => Promise<void>

// beforeAll are ran in parallel, we need to wait for clearDb to be done before mocking data
export const useMongo = (mock: MockData | null = null, step: "beforeAll" | "beforeEach" = "beforeEach") => {
  beforeAll(async () => {
    await startAndConnectMongodb()
    if (step === "beforeAll") {
      await clearAllCollections()
      await mock?.()
    }
  })

  afterAll(async () => {
    await stopMongodb()
  })

  if (step === "beforeEach") {
    beforeEach(async () => {
      await clearAllCollections()
      await mock?.()
    })
  }
}
