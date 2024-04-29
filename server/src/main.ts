import { connectToMongo } from "@/common/mongodb"
// import {connectToMongodb} from "@/common/utils/mongodbUtils" // uncomment when migrated to mongoDB V7

import { startCLI } from "./commands"
import { logger } from "./common/logger"
import config from "./config"

process.on("unhandledRejection", (err) => logger.error(err, "unhandledRejection"))
process.on("uncaughtException", (err) => logger.error(err, "uncaughtException"))

try {
  logger.warn("starting application")
  await connectToMongo(config.mongodb.uri)
  // uncomment when migrated to mongoDB V7
  // await connectToMongo(config.mongodb.uri)

  await startCLI()
} catch (err) {
  logger.error(err, "startup error")
  process.exit(1) // eslint-disable-line n/no-process-exit
}
