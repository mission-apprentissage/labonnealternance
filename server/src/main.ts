import { connectToMongodb } from "@/common/utils/mongodbUtils"

import { startCLI } from "./commands"
import { logger } from "./common/logger"
import config from "./config"
import { setupJobProcessor } from "./jobs/jobs"

process.on("unhandledRejection", (err) => logger.error(err, "unhandledRejection"))
process.on("uncaughtException", (err) => logger.error(err, "uncaughtException"))

try {
  logger.warn("starting application")
  await connectToMongodb(config.mongodb.uri)
  await setupJobProcessor()
  await startCLI()
} catch (err) {
  logger.error(err, "startup error")
  process.exit(1) // eslint-disable-line n/no-process-exit
}
