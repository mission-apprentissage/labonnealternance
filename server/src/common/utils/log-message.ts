import { logger } from "@/common/logger"

const logMessage = (level, msg) => {
  if (level === "info") {
    logger.info(msg)
  } else {
    logger.error(msg)
  }
}

export { logMessage }
