import * as Sentry from "@sentry/node"
import type { FastifyError, FastifyRequest } from "fastify"
import { assertUnreachable } from "shared"

import type { Server } from "@/http/server"

import { REDACTED } from "./sentry"

// Le compte appelant n'est remonté que par son identifiant, jamais par son e-mail : `id` part aussi
// dans les sessions Sentry (`did`), qui ne passent pas par beforeSend.
function extractUserData(request: FastifyRequest): Sentry.User {
  const user = request.user

  if (!user) {
    return { segment: "anonymous" }
  }

  const userType = user.type

  if (userType === "ICredential") {
    return { segment: "api-key", id: user.value._id.toString() }
  }
  if (userType === "IAccessToken") {
    const identity = user.value.identity
    return { segment: "access-token", identity: identity.type, ...("_id" in identity ? { id: identity._id.toString() } : {}) }
  }
  if (userType === "IUser2") {
    return { segment: "session", id: user.value._id.toString() }
  }
  if (userType === "IApiApprentissage") {
    return { segment: "api-apprentissage", organisation: user.value.organisation }
  }
  assertUnreachable(userType)
}

// Recherche en texte libre de l'admin : nom ou e-mail d'un compte. Classement de tous les paramètres
// déclarés : cf. QUERY_PARAMS_MASKED dans sentry.test.ts.
const PERSONAL_QUERY_PARAMS: ReadonlySet<string> = new Set(["search"])

/**
 * Query entrante gardée pour le diagnostic (critères de recherche, identifiants) : seules les valeurs
 * des paramètres déclarés par la route passent. Clés sensibles et e-mails : cf. scrubSensitiveData.
 */
export function getDiagnosticQuery(query: Record<string, unknown>, declaredKeys: ReadonlySet<string>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(query).map(([key, value]) => [key, declaredKeys.has(key) && !PERSONAL_QUERY_PARAMS.has(key) ? value : REDACTED]))
}

function getDeclaredQueryKeys(request: FastifyRequest): ReadonlySet<string> {
  const querystring = request.routeOptions.schema?.querystring as { shape?: Record<string, unknown> } | undefined
  return new Set(Object.keys(querystring?.shape ?? {}))
}

/** Appelé par le middleware `auth` dès que `request.user` est connu, avant l'autorisation et le handler. */
export function setSentryUser(request: FastifyRequest): void {
  Sentry.getIsolationScope().setUser(extractUserData(request))
}

export function initSentryFastify(app: Server) {
  // shouldHandleError capture cet handler AVANT le passage par errorMiddleware/boomify : sans lui,
  // les erreurs de validation Fastify (querystring/body, statusCode 400, ex. FST_ERR_VALIDATION)
  // remontent brutes et échappent au filtre beforeSend de sentry.ts (qui ne sait reconnaître que
  // les erreurs déjà Boom-ifiées) — bruit constaté sur GET /api/v1/formations et /api/v3/jobs/search.
  Sentry.setupFastifyErrorHandler(app, {
    shouldHandleError: (error) => {
      const statusCode = (error as FastifyError).statusCode
      return statusCode === undefined || statusCode >= 500
    },
  })

  app.addHook("onRequest", async (request, _reply) => {
    Sentry.getIsolationScope()
      // Remplacé après authentification (cf. setSentryUser) : les hooks globaux passent avant le `onRequest` des routes.
      .setUser({ segment: "anonymous" })
      // Relie l'événement aux logs de la requête dans Loki, qui gardent ce que Sentry ne reçoit pas.
      .setTag("reqId", request.id)
      .setExtra("headers", request.headers)
      .setExtra("method", request.method)
      .setExtra("protocol", request.protocol)
      .setExtra("query", getDiagnosticQuery((request.query as Record<string, unknown> | undefined) ?? {}, getDeclaredQueryKeys(request)))
  })

  // Corps parsé, avant validation : seuls les noms des champs partent, leurs valeurs sont personnelles (candidature, compte, offre).
  app.addHook("preValidation", async (request, _reply) => {
    if (request.body !== null && typeof request.body === "object" && !Array.isArray(request.body)) {
      Sentry.getIsolationScope().setExtra("body_keys", Object.keys(request.body))
    }
  })
}
