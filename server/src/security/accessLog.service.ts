import { FastifyRequest } from "fastify"
import { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { assertUnreachable } from "shared/utils"

import { IAccessLog } from "@/security/accessLog.types"

import { logger } from "../common/logger"

const loggerAccess = logger.child({ module: "accessLog" })

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
        break
      }
      default: {
        assertUnreachable(req.user)
        break
      }
    }
  }

  authorized ? loggerAccess.info(acl) : loggerAccess.warn(acl)
}
