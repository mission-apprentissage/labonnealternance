import { notFound } from "@hapi/boom"
import fastify from "fastify"
import { ZodTypeProvider, serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"

import { coreRoutes } from "./controllers/core.controller"
import { errorMiddleware } from "./middlewares/errorMiddleware"
import { logMiddleware } from "./middlewares/logMiddleware"
import type { Server } from "./server"

async function bind(app: Server) {
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.register(
    (subApp, _, done) => {
      const typedSubApp = subApp.withTypeProvider<ZodTypeProvider>()
      coreRoutes(typedSubApp)

      done()
    },
    { prefix: "/api" }
  )

  app.setNotFoundHandler((_req, res) => {
    res.status(404).send(notFound().output)
  })

  errorMiddleware(app)
  return app
}

export const bindProcessorServer = async (): Promise<Server> => {
  const app: Server = fastify({
    logger: logMiddleware(),
    trustProxy: 1,
    caseSensitive: false,
  }).withTypeProvider<ZodTypeProvider>()

  return bind(app)
}
