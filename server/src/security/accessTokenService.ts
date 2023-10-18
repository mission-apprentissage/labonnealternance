import jwt from "jsonwebtoken"
import { IUserRecruteur } from "shared/models"
import { IRouteSchema, ISecuredRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"

import config from "@/config"

type IScope<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme> = {
  path: S["path"]
  method: S["method"]
  resources: {
    [key in keyof S["securityScheme"]["ressources"]]: ReadonlyArray<string>
  }
}

export type IAccessToken<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme = Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme> = {
  identity:
    | {
        type: "candidat"
        email: string
      }
    | {
        type: "IUserRecruteur"
        _id: string
        email: string
      }
    | {
        type: "cfa"
        email: string
      }
  scopes: ReadonlyArray<IScope<S>>
}

function getAudience<S extends Pick<IRouteSchema, "method" | "path">>(scopes: ReadonlyArray<S>): string[] {
  return scopes.map((scope) => `${scope.method} ${scope.path}`.toLowerCase())
}

type RouteResources<S extends ISecuredRouteSchema> = {
  [key in keyof S["securityScheme"]["ressources"]]: ReadonlyArray<string>
}

export function generateAccessToken<S extends ISecuredRouteSchema>(
  user: IUserRecruteur | IAccessToken["identity"],
  routes: ReadonlyArray<{ route: S; resources: RouteResources<S> }>,
  options: { expiresIn?: string } = {}
): string {
  const audience = getAudience(routes.map((r) => r.route))

  const identity: IAccessToken["identity"] = "_id" in user ? { type: "IUserRecruteur", _id: user._id.toString(), email: user.email.toLowerCase() } : user

  const data: IAccessToken<S> = {
    identity,
    scopes: routes.map((route) => {
      return {
        path: route.route.path,
        method: route.route.method,
        resources: route.resources,
      }
    }),
  }

  return jwt.sign(data, config.auth.user.jwtSecret, {
    audience,
    expiresIn: options.expiresIn ?? config.auth.user.expiresIn,
    issuer: config.publicUrl,
  })
}

export function getAccessTokenScope<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(
  token: IAccessToken<S> | null,
  schema: Pick<S, "method" | "path">
): IScope<S> | null {
  return token?.scopes.find((s) => s.path === schema.path && s.method === schema.method) ?? null
}

export function parseAccessToken<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(
  accessToken: null | string,
  schema: Pick<S, "method" | "path">
): IAccessToken<S> | null {
  if (!accessToken) {
    return null
  }

  const data = jwt.verify(accessToken, config.auth.user.jwtSecret, {
    complete: true,
    audience: getAudience([schema]),
    issuer: config.publicUrl,
  })

  const token = data.payload as IAccessToken<S>

  return token
}
