import { connectToMongo } from "@/common/mongodb"
import config from "@/config"
import mongoose, { STATES } from "mongoose"
import { afterAll, beforeAll } from "vitest"
import { beforeEach } from "vitest"

export const startAndConnectMongodb = async () => {
  const workerId = `${process.env.VITEST_POOL_ID}-${process.env.VITEST_WORKER_ID}`

  await connectToMongo(config.mongodb.uri.replace("VITEST_POOL_ID", workerId))
}

export const stopMongodb = async () => {
  if (mongoose.connection.readyState === STATES.connected) {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
}

export const useMongo = () => {
  beforeAll(async () => {
    await startAndConnectMongodb()
  })

  afterAll(async () => {
    await stopMongodb()
  })

  beforeEach(async () => {
    const collections = mongoose.connection.collections

    await Promise.all(
      Object.values(collections).map(async (collection) => {
        // @ts-ignore
        await collection.deleteMany({})
      })
    )
  })
}
