import mongoose from "mongoose"

import config from "../config"

export const mongooseInstance = mongoose
export const { model, Schema } = mongoose
// @ts-ignore
export let db: ReturnType<typeof mongoose.Connection> // eslint-disable-line import/no-mutable-exports

export const connectToMongo = (mongoUri = config.mongodb.uri, mongooseInst = null) => {
  return new Promise((resolve, reject) => {
    console.log(`MongoDB: Connection to ${mongoUri}`)

    const mI = mongooseInst || mongooseInstance

    // Bind connection to error event (to get notification of connection errors)
    db.on("error", (e) => {
      console.error("MongoDB: connection error:")
      reject(e)
    })

    db.once("open", () => {
      console.log("MongoDB: Connected")
      resolve({ db })
    });
    
    // Set up default mongoose connection
    mI.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      keepAlive: true,
    })
  })
}

export const closeMongoConnection = (mongooseInst = mongoose) => mongooseInst.disconnect()
