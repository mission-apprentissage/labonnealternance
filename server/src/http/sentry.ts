/**
 * KBA : to be updated when switching to mongoDB
 * url : https://github.com/mission-apprentissage/api-apprentissage/blob/105fdf0aadadf1fc5bf2d8184a8825a64204fd17/server/src/services/sentry/sentry.ts
 */

// @ts-nocheck
import fastifySentryPlugin from "@immobiliarelabs/fastify-sentry"
import { ExtraErrorData } from "@sentry/integrations"
import * as Sentry from "@sentry/node"
import { FastifyRequest } from "fastify"

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
    }
  }

  return {
    segment: "session",
    id: user.value._id.toString(),
    email: user.value.email,
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
}
