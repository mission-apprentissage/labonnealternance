import { notFound } from "@hapi/boom"
import fastify from "fastify"
import type { ZodTypeProvider} from "fastify-type-provider-zod";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod"
import { zRoutes } from "shared"


import { errorMiddleware } from "./middlewares/errorMiddleware"
import { logMiddleware } from "./middlewares/logMiddleware"
import type { Server } from "./server"
import config from "@/config"
import { ensureInitialization, getMongodbClientState } from "@/common/utils/mongodbUtils"

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
    logger: logMiddleware(),
    trustProxy: 1,
    caseSensitive: false,
  }).withTypeProvider<ZodTypeProvider>()

  return bind(app)
}
