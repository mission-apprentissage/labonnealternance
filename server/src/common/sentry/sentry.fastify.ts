import * as Sentry from "@sentry/node"
import type { FastifyRequest } from "fastify"
import { assertUnreachable } from "shared"

import { Server } from "../../http/server"

type UserData = {
  segment: string
  id?: string | number
  email?: string
} & Record<string, unknown>

function extractUserData(request: FastifyRequest): UserData {
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
  app.addHook("onRequest", async (request, _reply) => {
    const scope = Sentry.getIsolationScope()
    scope
      .setUser(extractUserData(request))
      .setExtra("headers", request.headers)
      .setExtra("method", request.method)
      .setExtra("protocol", request.protocol)
      .setExtra("query_string", request.query)
  })
}
