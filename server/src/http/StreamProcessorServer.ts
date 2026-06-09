import { notFound } from "@hapi/boom"
import fastify from "fastify"
import type { ZodTypeProvider } from "fastify-type-provider-zod"
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"
import { zRoutes } from "shared"
import { enterRequestLoggerContext, getRootLogger } from "@/common/logger"
import { ensureInitialization, getMongodbClientState } from "@/common/utils/mongodbUtils"
import config from "@/config"
import { errorMiddleware } from "./middlewares/errorMiddleware"
import type { Server } from "./server"

const getHealthCheck = async () => {
  ensureInitialization()
  const dbState = await getMongodbClientState()
  const mongo = dbState === "connected"
  const error = !mongo

  return {
    name: "La bonne alternance",
    version: config.version,
    env: config.env,
    commitHash: config.commitHash,
    mongo,
    error,
  }
}

async function bind(app: Server) {
  app.addHook("onRequest", (request, _reply, done) => {
    enterRequestLoggerContext(request.log)
    done()
  })
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  app.register(
    (subApp, _, done) => {
      const typedSubApp = subApp.withTypeProvider<ZodTypeProvider>()

      typedSubApp.get("/", { schema: zRoutes.get["/"] }, async (_request, response) => {
        const result = await getHealthCheck()
        response.status(result.error ? 500 : 200).send(result)
      })
      typedSubApp.get("/healthcheck", { schema: zRoutes.get["/healthcheck"] }, async (_request, response) => {
        const result = await getHealthCheck()
        response.status(result.error ? 500 : 200).send(result)
      })

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

export const bindStreamProcessorServer = async (): Promise<Server> => {
  const app: Server = fastify({
    loggerInstance: getRootLogger(),
    trustProxy: 1,
    routerOptions: {
      caseSensitive: false,
    },
  }).withTypeProvider<ZodTypeProvider>()

  return bind(app)
}
