import { getProcessorHealthcheck } from "job-processor"
import { zRoutes } from "shared"

import { ensureInitialization, getMongodbClientState } from "@/common/utils/mongodbUtils"
import config from "@/config"
import type { Server } from "@/http/server"

const computeProcessorHealthCheck = async () => {
  return {
    ...(await getProcessorHealthcheck()),
    error: false,
  }
}

const getBaseHealthCheck = async () => {
  ensureInitialization()
  const dbState = await getMongodbClientState()
  const mongo = dbState === "connected"

  return {
    name: "La bonne alternance",
    version: config.version,
    env: config.env,
    commitHash: config.commitHash,
    mongo,
  }
}

const getLiveHealthCheck = async () => {
  const baseHealthCheck = await getBaseHealthCheck()

  return {
    ...baseHealthCheck,
    processor: null,
    error: !baseHealthCheck.mongo,
  }
}

const getHealthCheck = async () => {
  const baseHealthCheck = await getBaseHealthCheck()
  const processorHealth = await computeProcessorHealthCheck()

  return {
    ...baseHealthCheck,
    processor: processorHealth,
    error: !baseHealthCheck.mongo,
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
  app.get("/livez", { schema: zRoutes.get["/livez"] }, async (_request, response) => {
    const result = await getLiveHealthCheck()
    response.status(result.error ? 500 : 200).send(result)
  })
}
