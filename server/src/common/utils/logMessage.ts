import { logger } from "../logger.js"
const logMessage = (level, msg) => {
  if (level === "info") {
    logger.info(msg)
  } else {
    logger.error(msg)
  }
}

export { logMessage }
