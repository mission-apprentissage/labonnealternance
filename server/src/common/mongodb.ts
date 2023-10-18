import mongoose from "mongoose"

import config from "../config"

import { logger } from "./logger"

export const mongooseInstance = mongoose
export const { model, Schema } = mongoose
// @ts-expect-error
export let db: ReturnType<typeof mongoose.Connection> // eslint-disable-line import/no-mutable-exports

export const connectToMongo = (mongoUri = config.mongodb.uri) => {
  return new Promise((resolve, reject) => {
    logger.info(`MongoDB: Connection to ${mongoUri}`)

    // Set up default mongoose connection
    mongooseInstance.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      keepAlive: true,
      autoIndex: false,
    })
    mongooseInstance.Promise = global.Promise // Get the default connection
    db = mongooseInstance.connection

    // Bind connection to error event (to get notification of connection errors)
    db.on("error", (e) => {
      logger.error("MongoDB: connection error:")
      reject(e)
    })

    db.once("open", () => {
      logger.info("MongoDB: Connected")
      resolve({ db })
    })
  })
}

export const closeMongoConnection = () => mongooseInstance.disconnect()
