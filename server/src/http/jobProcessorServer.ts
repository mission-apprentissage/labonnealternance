import fastifyRateLimt from "@fastify/rate-limit"
import { notFound } from "@hapi/boom"
import fastify from "fastify"
import { ZodTypeProvider, validatorCompiler, serializerCompiler } from "fastify-type-provider-zod"
import { Netmask } from "netmask"

import { coreRoutes } from "./controllers/core.controller"
import { jobProcessorController } from "./controllers/jobProcessor.controller"
import { errorMiddleware } from "./middlewares/errorMiddleware"
import { logMiddleware } from "./middlewares/logMiddleware"
import type { Server } from "./server"

async function bind(app: Server) {
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  const allowedIps = [new Netmask("127.0.0.0/16"), new Netmask("10.0.0.0/8"), new Netmask("172.16.0.0/12"), new Netmask("192.168.0.0/16")]
  await app.register(fastifyRateLimt, {
    global: false,
    allowList: (req) => {
      // Do not rate-limit private & internal IPs
      return allowedIps.some((block) => block.contains(req.ip))
    },
  })

  app.register(
    (subApp, _, done) => {
      const typedSubApp = subApp.withTypeProvider<ZodTypeProvider>()
      jobProcessorController(typedSubApp)
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
