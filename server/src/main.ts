import { connectToMongo } from "common/mongodb"

import { startCLI } from "./commands"
import { logger } from "./common/logger"
import config from "./config"

// import createGlobalServices from "./services";

process.on("unhandledRejection", (err) => logger.error(err, "unhandledRejection"))
process.on("uncaughtException", (err) => logger.error(err, "uncaughtException"))

try {
  logger.warn("starting application")
  await connectToMongo(config.mongodb.uri)

  // createGlobalServices();
  startCLI()
} catch (err) {
  logger.error({ err }, "startup error")
  process.exit(1) // eslint-disable-line no-process-exit
}
