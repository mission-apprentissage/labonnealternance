import mongoose from "mongoose"

import config from "../config"

import { logger } from "./logger"

export const mongooseInstance = mongoose
export const { model, Schema } = mongoose
// @ts-expect-error
export let db: ReturnType<typeof mongoose.Connection> // eslint-disable-line import/no-mutable-exports

export const connectToMongo = async (mongoUri = config.mongodb.uri) => {
  logger.info(`MongoDB: Connection to ${mongoUri}`)

  try {
    // Set up default mongoose connection
    await mongooseInstance.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      keepAlive: true,
      autoIndex: false,
      poolSize: 1_000,
    })
    mongooseInstance.Promise = global.Promise // Get the default connection
    db = mongooseInstance.connection

    logger.info("MongoDB: Connected")
    return { db }
  } catch (error: any) {
    logger.error("MongoDB: connection error:", error.message)
    throw new Error(`MongoDB: connection error`)
  }
}

export const closeMongoConnection = async () => {
  logger.info("MongoDB: closing connection")
  await mongooseInstance.disconnect()
}
