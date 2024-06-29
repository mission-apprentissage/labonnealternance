import { access, mkdir } from "node:fs/promises"

import { isEmpty } from "lodash-es"
import prettyMilliseconds from "pretty-ms"

import { getLoggerWithContext } from "../common/logger"
import { closeMongodbConnection } from "../common/utils/mongodbUtils"
import config from "../config"

const logger = getLoggerWithContext("script")

process.on("unhandledRejection", (e) => logger.error(e))
process.on("uncaughtException", (e) => logger.error(e))
process.stdout.on("error", function (err) {
  if (err.code === "EPIPE") {
    // eslint-disable-next-line n/no-process-exit
    process.exit(0)
  }
})

const createTimer = () => {
  let launchTime
  return {
    start: () => {
      launchTime = new Date().getTime()
    },
    stop: (results) => {
      const duration = prettyMilliseconds(new Date().getTime() - launchTime)
      const data = results && results.toJSON ? results.toJSON() : results
      if (!isEmpty(data)) {
        logger.info(JSON.stringify(data, null, 2))
      }
      logger.info(`Completed in ${duration}`)
    },
  }
}

const ensureOutputDirExists = async () => {
  const outputDir = config.outputDir
  try {
    await access(outputDir)
  } catch (e: any) {
    if (e.code !== "EEXIST") {
      await mkdir(outputDir, { recursive: true })
    }
  }
  return outputDir
}

const exit = async (scriptError?: any) => {
  if (scriptError) {
    logger.error(scriptError.constructor.name === "EnvVarError" ? scriptError.message : scriptError)
    process.exitCode = 1
  }

  setTimeout(() => {
    //Waiting logger to flush all logs (MongoDB)
    closeMongodbConnection().catch((e) => {
      console.error(e)
      process.exitCode = 1
    })
  }, 250)
}

async function runScript(job: () => Promise<any>) {
  try {
    const timer = createTimer()
    timer.start()

    await ensureOutputDirExists()

    const results = await job()

    timer.stop(results)
    await exit()
  } catch (e) {
    await exit(e)
  }
}

export { runScript }
