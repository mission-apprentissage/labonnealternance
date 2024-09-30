import dayjs from "dayjs"
import { getProcessorHealthcheck } from "job-processor"
import { zRoutes } from "shared"

import config from "@/config"

import { ensureInitialization, getMongodbClientState } from "../../common/utils/mongodbUtils"
import { Server } from "../server"

const computeProcessorHealthCheck = async () => {
  const health = await getProcessorHealthcheck()
  const { workers } = health
  const startedAtOpt = workers.at(0)?.task?.started_at
  const error: boolean = Boolean(startedAtOpt && dayjs(startedAtOpt).isBefore(dayjs().subtract(6, "hour")))
  return {
    ...health,
    error,
  }
}

const getHealthCheck = async () => {
  ensureInitialization()
  const dbState = await getMongodbClientState()
  const mongo = dbState === "connected"
  const processorHealth = await computeProcessorHealthCheck()
  const error = !mongo || processorHealth.error

  return {
    name: "La bonne alternance",
    version: config.version,
    env: config.env,
    commitHash: config.commitHash,
    mongo,
    processor: processorHealth,
    error,
  }
}

export const coreRoutes = (app: Server) => {
  app.get("/", { schema: zRoutes.get["/"] }, async (_request, response) => {
    const result = await getHealthCheck()
    response.status(result.error ? 500 : 200).send(result)
  })
  app.get("/healthcheck", { schema: zRoutes.get["/healthcheck"] }, async (_request, response) => {
    const result = await getHealthCheck()
    response.status(result.error ? 500 : 200).send(result)
  })
}
