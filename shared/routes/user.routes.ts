import { z } from "../helpers/zodWithOpenApi"
import { zObjectId } from "../models/common"
import { ZUserRecruteur, ZUserStatusValidation } from "../models/usersRecruteur.model"

import { IRoutesDef, ZResError } from "./common.routes"

export const zUserRecruteurRoutes = {
  get: {
    "/user/opco": {
      // TODO_SECURITY_FIX supprimer  les mongo query
      // TODO_SECURITY_FIX session cookie plus permission
      // TODO_SECURITY_FIX enlever les données privées (dont last connection date)
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
        auth: "none",
        role: "all",
      },
    },
    "/user": {
      // TODO ANY TO BE FIXED
      // TODO_SECURITY_FIX session admin only et changer le chemin vers /admin/user
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
        auth: "jwt-bearer",
        role: "all",
      },
    },
    "/user/:userId": {
      // TODO_SECURITY_FIX session et cookie + permissions
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
        auth: "none",
        role: "all",
      },
    },
  },
  post: {
    "/user": {
      // TODO_SECURITY_FIX réduire la payload au strict nécessaire
      // TODO checker si unused
      body: ZUserRecruteur.extend({
        scope: z.string().optional(),
      }).strict(),
      response: {
        "200": ZUserRecruteur,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  put: {
    "/user/:userId": {
      // TODO_SECURITY_FIX session et cookie + permissions
      params: z.object({ userId: zObjectId }).strict(),
      body: ZUserRecruteur.pick({
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
        auth: "none",
        role: "all",
      },
    },
    "/user/:userId/history": {
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
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  delete: {
    "/user": {
      // TODO_SECURITY_FIX session et cookie + permissions
      // TODO return json format
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
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
