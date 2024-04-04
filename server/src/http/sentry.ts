import fastifySentryPlugin from "@immobiliarelabs/fastify-sentry"
import { ExtraErrorData } from "@sentry/integrations"
import * as Sentry from "@sentry/node"
import { FastifyRequest } from "fastify"

import { mongooseInstance } from "@/common/mongodb"
import { startSentryPerfRecording } from "@/common/utils/sentryUtils"
import config from "@/config"

import { Server } from "./server"

function getOptions() {
  return {
    dsn: config.serverSentryDsn,
    tracesSampleRate: config.env === "production" ? 0.1 : 1.0,
    tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/],
    environment: config.env,
    release: config.version,
    enabled: config.env !== "local",
    integrations: [new Sentry.Integrations.Http({ tracing: true }), new Sentry.Integrations.Mongo({ useMongoose: true }), new ExtraErrorData({ depth: 8 })],
  }
}

export function initSentryProcessor(): void {
  Sentry.init(getOptions() as any)
  registerMongoosePlugin()
}

export async function closeSentry(): Promise<void> {
  await Sentry.close(2_000)
}

function extractUserData(request: FastifyRequest) {
  const user = request.user

  if (!user) {
    return {
      segment: "anonymous",
    }
  }

  if (user.type === "ICredential") {
    return {
      segment: "api-key",
      id: user.value._id.toString(),
      email: user.value.email,
    }
  }

  if (user.type === "IAccessToken") {
    const identity = user.value.identity
    return {
      segment: "access-token",
      id: "_id" in identity ? identity._id.toString() : identity.email,
      email: identity.email,
      type: identity.type,
    }
  }

  return {
    segment: "session",
    id: user.value._id.toString(),
    email: user.value.email,
    type: user.value.type,
  }
}

export function initSentryFastify(app: Server) {
  const options: any = {
    setErrorHandler: false,
    extractUserData: extractUserData,
    extractRequestData: (request: FastifyRequest) => {
      return {
        headers: request.headers,
        method: request.method,
        protocol: request.protocol,
        query_string: request.query,
      }
    },
    ...getOptions(),
  }

  app.register(fastifySentryPlugin, options)
  registerMongoosePlugin()
}

function registerMongoosePlugin() {
  // Tracing.Integrations.Mongo doesn't track properly db operations
  // see https://github.com/getsentry/sentry-javascript/issues/4078
  mongooseInstance.plugin((s) => {
    // List of all events can be found here https://mongoosejs.com/docs/5.x/docs/middleware.html
    const ops = [
      "aggregate",
      "count",
      "countDocuments",
      "deleteOne",
      "deleteMany",
      "estimatedDocumentCount",
      "find",
      "findOne",
      "findOneAndDelete",
      "findOneAndRemove",
      "findOneAndReplace",
      "findOneAndUpdate",
      "insertMany",
      "remove",
      "replaceOne",
      "save",
      "update",
      "updateOne",
      "updateMany",
      "validate",
    ]

    // For each event we will start perf recording on pre event and stop it on post event
    ops.forEach((op) => {
      // We need to store callback returned from startSentryPerfRecording to be called in post event
      // Because queries can run in parallel we need to execute the proper callback on post event
      // Finally we need a WeakMap to be sure we release memory in case of any failure.
      const queryToCbMap = new WeakMap()
      s.pre(op, function () {
        // this reference the current query according to mongoose plugin API
        queryToCbMap.set(this, startSentryPerfRecording("mongoose", op))
      })
      s.post(op, function () {
        // Execute the associated callback if found
        queryToCbMap.get(this)?.()
        // Make sure to remove the query from the map
        queryToCbMap.delete(this)
      })
    })
  })
}
