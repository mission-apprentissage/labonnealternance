import dayjs from "dayjs"
import promises from "fs"
import { closeMongoConnection } from "../common/mongodb.js"
import createComponents from "../common/components/components"
import { logger } from "../common/logger.js"
import config from "../config.js"

const { access, mkdir } = promises

process.on("unhandledRejection", (e) => console.log(e))
process.on("uncaughtException", (e) => console.log(e))

const createTimer = () => {
  let launchTime
  return {
    start: () => {
      launchTime = dayjs()
    },
    stop: (results) => {
      const duration = dayjs().diff(launchTime, "second")
      const data = results && results.toJSON ? results.toJSON() : results
      console.log(JSON.stringify(data || {}, null, 2))
      console.log(`Completed in ${duration} second(s)`)
    },
  }
}

const ensureOutputDirExists = async () => {
  const outputDir = config.outputDir
  try {
    await access(outputDir)
  } catch (e) {
    if (e.code !== "EEXIST") {
      await mkdir(outputDir, { recursive: true })
    }
  }
  return outputDir
}

const exit = async (rawError) => {
  let error = rawError
  if (rawError) {
    logger.error(rawError.constructor.name === "EnvVarError" ? rawError.message : rawError)
  }

  setTimeout(() => {
    //Waiting logger to flush all logs (MongoDB)
    closeMongoConnection()
      .then(() => {})
      .catch((closeError) => {
        error = closeError
        console.log(error)
      })
  }, 250)

  process.exitCode = error ? 1 : 0
}

async function runScript(job) {
  try {
    const timer = createTimer()
    timer.start()

    await ensureOutputDirExists()
    const components = await createComponents()
    const results = await job(components)

    timer.stop(results)
    await exit()
  } catch (e) {
    await exit(e)
  }
}

export { runScript }
