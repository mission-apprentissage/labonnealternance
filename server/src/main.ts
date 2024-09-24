import { modelDescriptors } from "shared/models/models"

import { connectToMongodb, configureDbSchemaValidation } from "@/common/utils/mongodbUtils"

import { startCLI } from "./commands"
import { logger } from "./common/logger"
import config from "./config"

process.on("unhandledRejection", (err) => logger.error(err, "unhandledRejection"))
process.on("uncaughtException", (err) => logger.error(err, "uncaughtException"))

try {
  logger.warn("starting application")
  await connectToMongodb(config.mongodb.uri)
  await configureDbSchemaValidation(modelDescriptors)
  await startCLI()
} catch (err) {
  logger.error(err, "startup error")
  process.exit(1) // eslint-disable-line n/no-process-exit
}
