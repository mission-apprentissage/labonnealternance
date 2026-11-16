import * as Sentry from "@sentry/node"
import type { FastifyRequest } from "fastify"
import type { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { assertUnreachable } from "shared/utils/index"
import type { IAccessLog } from "./access-log.types"

export const createAccessLog = async <S extends IRouteSchema & WithSecurityScheme>(schema: S, req: FastifyRequest, authorized: boolean) => {
  if (schema?.securityScheme?.skipLogAccess) {
    return
  }

  const acl: IAccessLog = {
    authorized,
    auth_type: schema.securityScheme.auth,
    http_method: schema.method,
    path: schema.path,
    ip: req.ip,
    user_id: null,
    user_email: null,
    user_siret: null,
    user_type: null,
    user_organisation: null,
    // Trace continuée depuis l'en-tête `sentry-trace` de l'appelant, échantillonnée ou non : relie l'appel à celui de l'API Apprentissage.
    trace_id: Sentry.getActiveSpan()?.spanContext().traceId ?? null,
    created_at: new Date(),
    parameters: req.params as { [key: string]: string },
    resources: req?.authorizationContext?.resources,
  }

  if (authorized && req.user) {
    switch (req.user.type) {
      case "IUser2": {
        acl.user_type = req.user.type
        acl.user_id = req.user.value._id.toString()
        acl.user_email = req.user.value.email
        break
      }
      case "IAccessToken": {
        acl.user_type = req.user.value.identity.type
        acl.user_email = req.user.value.identity.email
        if ("siret" in req.user.value.identity) {
          acl.user_siret = req.user.value.identity.siret
        }
        if (req.user.value.identity.type === "IUserRecruteur") {
          acl.user_id = req.user.value.identity?._id?.toString()
        }
        break
      }
      case "ICredential": {
        acl.user_type = req.user.type
        acl.user_id = req.user.value._id.toString()
        acl.user_email = req.user.value.email
        break
      }
      case "IApiApprentissage": {
        acl.user_type = req.user.type
        acl.user_email = req.user.value.email
        acl.user_organisation = req.user.value.organisation
        break
      }
      default: {
        assertUnreachable(req.user)
        break
      }
    }
  }

  // Logger de la requête, qui porte son reqId.
  const loggerAccess = req.log.child({ module: "accessLog" })
  if (authorized) {
    loggerAccess.info(acl)
  } else {
    loggerAccess.warn(acl)
  }
}
