import mongoose from "mongoose"
import { zRoutes } from "shared"

import config from "@/config"

import { ServerBuilder } from "../utils/serverBuilder"

export const coreRoutes = (app: ServerBuilder) => {
  app.get({ schema: zRoutes.get["/"] }, async (request, response) => {
    const healthcheck = {
      // https://mongoosejs.com/docs/5.x/docs/api/connection.html#connection_Connection-readyState
      mongodb: mongoose.connection.readyState === 1,
    }

    response.status(healthcheck.mongodb ? 200 : 500).send({
      env: config.env,
      healthcheck,
    })
  })
  app.get({ schema: zRoutes.get["/healthcheck"] }, async (request, response) => {
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
