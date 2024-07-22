import { MongoDBInstrumentation } from "@opentelemetry/instrumentation-mongodb"
import * as Sentry from "@sentry/node"
import { nodeProfilingIntegration } from "@sentry/profiling-node"
import { FastifyRequest } from "fastify"
import { assertUnreachable } from "shared/utils"

import config from "@/config"

import { Server } from "./server"

function mongoDBIntegration() {
  return {
    name: "mongoDBIntegration",
    setup() {
      new MongoDBInstrumentation({ enhancedDatabaseReporting: true })
    },
  }
}

function getOptions(): Sentry.NodeOptions {
  return {
    dsn: config.serverSentryDsn,
    tracesSampleRate: config.env === "production" ? 0.1 : 1.0,
    tracePropagationTargets: [/^https:\/\/[^/]*\.apprentissage\.beta\.gouv\.fr/],
    environment: config.env,
    release: config.version,
    enabled: config.env !== "local",
    integrations: [nodeProfilingIntegration(), Sentry.extraErrorDataIntegration({ depth: 16 }), Sentry.captureConsoleIntegration({ levels: ["error"] }), mongoDBIntegration()],
  }
}

export function initSentryProcessor(): void {
  Sentry.init(getOptions())
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

  const userType = user.type

  if (userType === "ICredential") {
    return {
      segment: "api-key",
      id: user.value._id.toString(),
      email: user.value.email,
    }
  }

  if (userType === "IAccessToken") {
    const identity = user.value.identity
    return {
      segment: "access-token",
      id: "_id" in identity ? identity._id.toString() : identity.email,
      email: identity.email,
    }
  }
  if (userType === "IUser2") {
    return {
      segment: "session",
      id: user.value._id.toString(),
      email: user.value.email,
    }
  }
  if (userType === "IApiApprentissage") {
    return {
      segment: "api-apprentissage",
      email: user.value.email,
    }
  }
  assertUnreachable(userType)
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

  app.register(options)
}
