import { ETAT_UTILISATEUR } from "../constants/recruteur.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { zObjectId } from "../models/common.js"
import { ZJob } from "../models/job.model.js"
import { AccessEntityType, ZRoleManagement, ZRoleManagementEvent } from "../models/roleManagement.model.js"
import { ZEtatUtilisateur, ZUserRecruteur, ZUserRecruteurForAdmin } from "../models/usersRecruteur.model.js"
import { ZNewSuperUser, ZUserWithAccount, ZUserWithAccountFields } from "../models/userWithAccount.model.js"

import type { IRoutesDef } from "./common.routes.js"
import { ZResError } from "./common.routes.js"

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
  organizationId: z.string(),
})

export type IUserForOpco = z.output<typeof ZUserForOpco>

export const zUserRecruteurRoutes = {
  get: {
    "/user/opco": {
      method: "get",
      path: "/user/opco",
      response: {
        "200": z.strictObject({
          awaiting: z.array(ZUserForOpco),
          active: z.array(ZUserForOpco),
          disable: z.array(ZUserForOpco),
        }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: { every: ["user:manage", "recruiter:manage"] },
        resources: {},
      },
    },
    "/admin/users-recruteurs": {
      method: "get",
      path: "/admin/users-recruteurs",
      querystring: z.object({
        status: extensions.buildEnum(ETAT_UTILISATEUR).optional(),
        limit: z.coerce.number<number>().int().min(1).optional(),
        offset: z.coerce.number<number>().int().min(0).optional(),
        search: z.string().optional(),
      }),
      response: {
        "200": z.array(ZUserRecruteurForAdmin),
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
        "200": z.strictObject({
          users: z.array(ZUserWithAccount.extend({ type: z.enum([AccessEntityType.ADMIN, AccessEntityType.OPCO]) })),
        }),
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
      params: z.strictObject({
        userId: z.string(),
      }),
      response: {
        "200": ZUserWithAccount.extend({
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
      params: z.strictObject({
        userId: z.string(),
        organizationId: z.string(),
      }),
      response: {
        "200": ZUserRecruteur.extend({ jobs: z.array(ZJob), organizationId: z.string() }),
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
      params: z.strictObject({
        userId: z.string(),
      }),
      response: {
        "200": z.strictObject({
          status_current: ZEtatUtilisateur,
        }),
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
      params: z.strictObject({
        userId: z.string(),
      }),
      response: {
        "200": z.strictObject({
          status_current: ZEtatUtilisateur,
        }),
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
      body: ZNewSuperUser,
      response: {
        "200": z.strictObject({ _id: zObjectId }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
    "/user/:userId/organization/:organizationId/activate": {
      method: "post",
      path: "/user/:userId/organization/:organizationId/activate",
      params: z.strictObject({ userId: zObjectId, organizationId: zObjectId }),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "user:validate",
        resources: {
          user: [{ _id: { type: "params", key: "userId" } }],
        },
      },
    },
    "/user/:userId/organization/:organizationId/deactivate": {
      method: "post",
      path: "/user/:userId/organization/:organizationId/deactivate",
      params: z.strictObject({ userId: zObjectId, organizationId: zObjectId }),
      body: ZRoleManagementEvent.pick({
        reason: true,
      }),
      response: {
        "200": z.strictObject({}),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "user:validate",
        resources: {
          user: [{ _id: { type: "params", key: "userId" } }],
        },
      },
    },
    "/user/:userId/organization/:organizationId/not-my-opco": {
      method: "post",
      path: "/user/:userId/organization/:organizationId/not-my-opco",
      params: z.strictObject({ userId: zObjectId, organizationId: zObjectId }),
      body: ZRoleManagementEvent.pick({
        reason: true,
      }),
      response: {
        "200": z.strictObject({}),
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
  put: {
    "/user/:userId": {
      method: "put",
      path: "/user/:userId",
      params: z.strictObject({ userId: zObjectId }),
      body: ZUserWithAccount.pick({
        last_name: true,
        first_name: true,
        phone: true,
        email: true,
      }).strict(),
      response: {
        "200": z.object({}),
        "400": z.union([ZResError, z.strictObject({ error: z.boolean(), reason: z.string() })]),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "user:manage",
        resources: {
          user: [{ _id: { type: "params", key: "userId" } }],
        },
      },
    },
    "/admin/users/:userId": {
      method: "put",
      path: "/admin/users/:userId",
      params: z.strictObject({ userId: zObjectId }),
      body: ZUserWithAccountFields.partial(),
      response: {
        "200": z.strictObject({ ok: z.boolean() }),
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
      params: z.strictObject({ userId: zObjectId, siret: z.string() }),
      body: ZUserWithAccountFields.extend({
        opco: ZUserRecruteur.shape.opco,
      }).partial(),
      response: {
        "200": z.strictObject({ ok: z.boolean() }),
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
  },
  delete: {
    "/admin/users/:userId": {
      method: "delete",
      path: "/admin/users/:userId",
      params: z.strictObject({
        userId: z.string(),
      }),
      response: {
        "200": z.strictObject({ ok: z.boolean() }),
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
