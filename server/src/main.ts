import { modelDescriptors } from "shared/models/models"
import * as v8 from "v8"

import { startCLI } from "./commands"
import { logger } from "./common/logger"
import { configureDbSchemaValidation, connectToMongodb } from "./common/utils/mongodbUtils"
import config from "./config"

process.on("unhandledRejection", (err) => logger.error(err, "unhandledRejection"))
process.on("uncaughtException", (err) => logger.error(err, "uncaughtException"))

try {
  logger.warn("starting application")
  logger.info("V8 Options:", v8.getHeapStatistics())
  await connectToMongodb(config.mongodb.uri)
  await configureDbSchemaValidation(modelDescriptors)
  await startCLI()
} catch (err) {
  logger.error(err, "startup error")

  setTimeout(() => {
    process.exit(1) // eslint-disable-line n/no-process-exit
  }, 150).unref()
}
