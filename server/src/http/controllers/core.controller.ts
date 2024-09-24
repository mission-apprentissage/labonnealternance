import { zRoutes } from "shared"

import config from "@/config"

import { ensureInitialization, getMongodbClientState } from "../../common/utils/mongodbUtils"
import { Server } from "../server"

const getHealthCheck = async () => {
  ensureInitialization()
  const dbState = await getMongodbClientState()
  return {
    name: "La bonne alternance",
    version: config.version,
    env: config.env,
    commitHash: config.commitHash,
    mongo: dbState === "connected",
  }
}

export const coreRoutes = (app: Server) => {
  app.get("/", { schema: zRoutes.get["/"] }, async (_request, response) => {
    const result = await getHealthCheck()
    response.status(result.mongo ? 200 : 500).send(result)
  })
  app.get("/healthcheck", { schema: zRoutes.get["/healthcheck"] }, async (_request, response) => {
    const result = await getHealthCheck()
    response.status(result.mongo ? 200 : 500).send(result)
  })
}
