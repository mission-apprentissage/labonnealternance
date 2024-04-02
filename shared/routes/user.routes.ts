import { OPCOS } from "../constants/recruteur"
import { z } from "../helpers/zodWithOpenApi"
import { ZJob } from "../models"
import { zObjectId } from "../models/common"
import { enumToZod } from "../models/enumToZod"
import { AccessEntityType, ZRoleManagement, ZRoleManagementEvent } from "../models/roleManagement.model"
import { ZUser2 } from "../models/user2.model"
import { ZEtatUtilisateur, ZUserRecruteur, ZUserRecruteurForAdmin } from "../models/usersRecruteur.model"

import { IRoutesDef, ZResError } from "./common.routes"

const ZUserForOpco = ZUserRecruteur.pick({
  _id: true,
  first_name: true,
  last_name: true,
  establishment_id: true,
  establishment_raison_sociale: true,
  establishment_siret: true,
  createdAt: true,
  email: true,
  phone: true,
  type: true,
}).extend({
  jobs_count: z.number(),
  origin: z.string(),
  organizationId: zObjectId,
})

export type IUserForOpco = z.output<typeof ZUserForOpco>

export const zUserRecruteurRoutes = {
  get: {
    "/user/opco": {
      method: "get",
      path: "/user/opco",
      querystring: z
        .object({
          opco: enumToZod(OPCOS),
        })
        .strict(),
      response: {
        "200": z
          .object({
            awaiting: z.array(ZUserForOpco),
            active: z.array(ZUserForOpco),
            disable: z.array(ZUserForOpco),
          })
          .strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: { every: ["user:manage", "recruiter:manage"] },
        resources: {
          recruiter: [{ opco: { type: "query", key: "opco" } }],
        },
      },
    },
    "/user": {
      method: "get",
      path: "/user",
      // TODO_SECURITY_FIX session admin only et changer le chemin vers /admin/user
      // => /admin/user-recruteur?
      response: {
        "200": z
          .object({
            awaiting: z.array(ZUserRecruteurForAdmin),
            active: z.array(ZUserRecruteurForAdmin),
            disabled: z.array(ZUserRecruteurForAdmin),
            error: z.array(ZUserRecruteurForAdmin),
          })
          .strict(),
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
      response: {
        "200": z
          .object({
            users: z.array(ZUser2),
          })
          .strict(),
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
      response: {
        "200": ZUser2.extend({
          role: ZRoleManagement.optional(),
        }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/user/:userId/organization/:organizationId": {
      method: "get",
      path: "/user/:userId/organization/:organizationId",
      // TODO_SECURITY_FIX enlever les données privées (dont last connection date)
      params: z
        .object({
          userId: z.string(),
          organizationId: z.string(),
        })
        .strict(),
      response: {
        "200": ZUserRecruteur.extend({ jobs: z.array(ZJob) }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "user:manage",
        resources: {
          user: [
            {
              _id: { type: "params", key: "userId" },
            },
          ],
          entreprise: [{ _id: { type: "params", key: "organizationId" } }],
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
        access: { some: ["user:manage", "recruiter:add_job"] },
        resources: {
          user: [{ _id: { type: "params", key: "userId" } }],
        },
      },
    },
    "/user/status/:userId/by-token": {
      method: "get",
      path: "/user/status/:userId/by-token",
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
        auth: "access-token",
        access: { some: ["user:manage", "recruiter:add_job"] },
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
      body: ZUser2.pick({
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        origin: true,
      }),
      response: {
        "200": z.object({ _id: zObjectId }).strict(),
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
      params: z.object({ userId: zObjectId }).strict(),
      body: ZUser2.pick({
        last_name: true,
        first_name: true,
        phone: true,
        email: true,
      }).strict(),
      response: {
        "200": z.union([ZUserRecruteur, z.null()]),
        "400": z.union([ZResError, z.object({ error: z.boolean(), reason: z.string() }).strict()]),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "user:manage",
        resources: {
          user: [{ _id: { type: "params", key: "userId" } }],
        },
      },
    },
    "/admin/users/:userId/organization/:siret": {
      method: "put",
      path: "/admin/users/:userId/organization/:siret",
      params: z.object({ userId: zObjectId, siret: z.string() }).strict(),
      body: ZUser2.omit({
        status: true,
        _id: true,
      })
        .extend({
          opco: ZUserRecruteur.shape.opco,
        })
        .partial(),
      response: {
        "200": z.object({ ok: z.boolean() }).strict(),
        "400": z.union([ZResError, z.object({ error: z.boolean(), reason: z.string() }).strict()]),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "user:manage",
        resources: {
          user: [{ _id: { type: "params", key: "userId" } }],
          entreprise: [{ siret: { type: "params", key: "siret" } }],
        },
      },
    },
    "/user/:userId/organization/:organizationId/permission": {
      method: "put",
      path: "/user/:userId/organization/:organizationId/permission",
      params: z.object({ userId: zObjectId, organizationId: zObjectId }).strict(),
      body: ZRoleManagementEvent.pick({
        status: true,
        reason: true,
      }).extend({
        organizationType: z.enum([AccessEntityType.ENTREPRISE, AccessEntityType.CFA]),
      }),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "user:validate",
        resources: {
          user: [{ _id: { type: "params", key: "userId" } }],
        },
      },
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
