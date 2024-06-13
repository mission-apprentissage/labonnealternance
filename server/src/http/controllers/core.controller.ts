import { zRoutes } from "shared"

import config from "@/config"

import { ensureInitialization, getMongodbClientState } from "../../common/utils/mongodbUtils"
import { Server } from "../server"

export const coreRoutes = (app: Server) => {
  app.get("/", { schema: zRoutes.get["/"] }, async (request, response) => {
    ensureInitialization()
    const dbState = await getMongodbClientState()
    response.status(dbState === "connected" ? 200 : 500).send({
      name: "La bonne alternance",
      version: config.version,
      env: config.env,
      mongo: dbState === "connected",
    })
  })
  app.get("/healthcheck", { schema: zRoutes.get["/healthcheck"] }, async (request, response) => {
    ensureInitialization()
    const dbState = await getMongodbClientState()
    response.status(dbState === "connected" ? 200 : 500).send({
      name: "La bonne alternance",
      version: config.version,
      env: config.env,
      mongo: dbState === "connected",
    })
  })
}
