import { z } from "../helpers/zodWithOpenApi"
import { zObjectId } from "../models/common"
import { ZEtatUtilisateur, ZUserRecruteur, ZUserRecruteurWritable, ZUserStatusValidation } from "../models/usersRecruteur.model"

import { IRoutesDef, ZResError } from "./common.routes"

export const zUserRecruteurRoutes = {
  get: {
    "/user/opco": {
      method: "get",
      path: "/user/opco",
      querystring: z
        .object({
          opco: z.string(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            awaiting: z.array(z.any()),
            active: z.array(z.any()),
            disable: z.array(z.any()),
          })
          .strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: { every: ["user:manage", "recruiter:manage"] },
        resources: {
          user: [{ opco: { type: "query", key: "opco" } }],
          recruiter: [{ opco: { type: "query", key: "opco" } }],
        },
      },
    },
    "/user": {
      method: "get",
      path: "/user",
      // TODO ANY TO BE FIXED
      // TODO_SECURITY_FIX session admin only et changer le chemin vers /admin/user
      // => /admin/user-recruteur?
      response: {
        "200": z.any(),
        // "200": z.object({
        //   awaiting: z.array(ZUserRecruteur),
        //   active: z.array(ZUserRecruteur),
        //   disabled: z.array(ZUserRecruteur),
        //   error: z.array(ZUserRecruteur),
        // }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/admin/users": {
      method: "get",
      path: "/admin/users",
      // TODO ANY TO BE FIXED
      response: {
        "200": z.any(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/admin/users/:userId": {
      method: "get",
      path: "/admin/users/:userId",
      params: z
        .object({
          userId: z.string(),
        })
        .strict(),
      // TODO ANY TO BE FIXED
      response: {
        "200": z.any(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/user/:userId": {
      method: "get",
      path: "/user/:userId",
      // TODO_SECURITY_FIX enlever les données privées (dont last connection date)
      params: z
        .object({
          userId: z.string(),
        })
        .strict(),
      response: {
        // TODO ANY TO BE FIXED
        "200": z.any(),
        // "200": ZUserRecruteur.extend({ jobs: z.array(ZJob) }), //  "message": "Unrecognized key(s) in object: '__v'"
      },
      securityScheme: {
        auth: "cookie-session",
        access: "recruiter:manage",
        resources: {
          user: [
            {
              _id: { type: "params", key: "userId" },
            },
          ],
        },
      },
    },
    "/user/status/:userId": {
      method: "get",
      path: "/user/status/:userId",
      params: z
        .object({
          userId: z.string(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            status_current: ZEtatUtilisateur,
          })
          .strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "user:manage",
        resources: {
          user: [{ _id: { type: "params", key: "userId" } }],
        },
      },
    },
  },
  post: {
    "/admin/users": {
      method: "post",
      path: "/admin/users",
      // TODO TO BE FIXED
      body: z.object({}).passthrough(),
      // body: ZUserRecruteur.extend({
      //   scope: z.string().optional(),
      // }).strict(),
      response: {
        "200": ZUserRecruteur,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
  put: {
    "/user/:userId": {
      method: "put",
      path: "/user/:userId",
      // TODO_SECURITY_FIX session et cookie + permissions
      params: z.object({ userId: zObjectId }).strict(),
      body: ZUserRecruteurWritable.pick({
        last_name: true,
        first_name: true,
        phone: true,
        email: true,
        opco: true,
      })
        .partial()
        .strict(),
      response: {
        "200": z.union([ZUserRecruteur, z.null()]),
        "400": z.union([ZResError, z.object({ error: z.boolean(), reason: z.string() }).strict()]),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "recruiter:manage",
        resources: {
          user: [{ _id: { type: "params", key: "userId" } }],
        },
      },
    },
    "/admin/users/:userId": {
      method: "put",
      path: "/admin/users/:userId",
      params: z.object({ userId: zObjectId }).strict(),
      body: ZUserRecruteurWritable.partial(),
      response: {
        "200": z.object({ ok: z.boolean() }).strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/user/:userId/history": {
      method: "put",
      path: "/user/:userId/history",
      // TODO_SECURITY_FIX session et cookie + permissions + role
      params: z.object({ userId: zObjectId }).strict(),
      body: ZUserStatusValidation.pick({
        validation_type: true,
        status: true,
        reason: true,
        user: true,
      }),
      response: {
        // TODO ANY TO BE FIXED
        "200": z.any(),
        // "200": ZUserRecruteur,
      },
      securityScheme: null,
    },
  },
  delete: {
    "/user": {
      method: "delete",
      path: "/user",
      querystring: z
        .object({
          userId: zObjectId,
          recruiterId: zObjectId.optional(),
        })
        .strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "recruiter:manage",
        resources: {
          user: [
            {
              _id: { type: "query", key: "userId" },
            },
          ],
          recruiter: [
            {
              _id: { type: "query", key: "recruiterId" },
            },
          ],
        },
      },
    },
    "/admin/users/:userId": {
      method: "delete",
      path: "/admin/users/:userId",
      params: z
        .object({
          userId: z.string(),
        })
        .strict(),
      querystring: z
        .object({
          recruiterId: zObjectId.optional(),
        })
        .strict(),
      response: {
        "200": z.object({ ok: z.boolean() }).strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
