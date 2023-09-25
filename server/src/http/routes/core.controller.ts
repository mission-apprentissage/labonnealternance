import mongoose from "mongoose"
import { zRoutes } from "shared"

import config from "@/config"

import { Server } from "../server"

export const coreRoutes = (app: Server) => {
  app.get("/api", { schema: zRoutes.get["/api"] }, async (request, response) => {
    const healthcheck = {
      // https://mongoosejs.com/docs/5.x/docs/api/connection.html#connection_Connection-readyState
      mongodb: mongoose.connection.readyState === 1,
    }

    response.status(healthcheck.mongodb ? 200 : 500).send({
      env: config.env,
      healthcheck,
    })
  })
  app.get("/api/healthcheck", { schema: zRoutes.get["/api/healthcheck"] }, async (request, response) => {
    const healthcheck = {
      // https://mongoosejs.com/docs/5.x/docs/api/connection.html#connection_Connection-readyState
      mongodb: mongoose.connection.readyState === 1,
    }

    response.status(healthcheck.mongodb ? 200 : 500).send({
      env: config.env,
      healthcheck,
    })
  })
}
