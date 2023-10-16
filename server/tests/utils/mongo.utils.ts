import mongoose from "mongoose"
import { afterAll, beforeAll, beforeEach } from "vitest"

import { connectToMongo } from "@/common/mongodb"
import config from "@/config"

export const startAndConnectMongodb = async () => {
  const workerId = `${process.env.VITEST_POOL_ID}-${process.env.VITEST_WORKER_ID}`

  await connectToMongo(config.mongodb.uri.replace("VITEST_POOL_ID", workerId))
}

export const stopMongodb = async () => {
  try {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  } catch (err) {
    // no-op
  }
}

export const useMongo = (skipClearBeforeEach: boolean = false) => {
  const clearDb = async () => {
    const collections = mongoose.connection.collections

    await Promise.all(
      Object.values(collections).map(async (collection) => {
        await collection.deleteMany({})
      })
    )
  }

  beforeAll(async () => {
    await startAndConnectMongodb()
    if (skipClearBeforeEach) await clearDb()
  })

  afterAll(async () => {
    await stopMongodb()
  })

  if (!skipClearBeforeEach) beforeEach(clearDb)
}
