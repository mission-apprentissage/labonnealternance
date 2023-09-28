import { z } from "zod"

import { zObjectId } from "../models/common"
import { ZJob } from "../models/job.model"
import { ZUserRecruteur, ZUserStatusValidation } from "../models/usersRecruteur.model"

import { IRoutesDef } from "./common.routes"

export const zUserRecruteurRoutes = {
  get: {
    "/api/user/opco": {
      // TODO_SECURITY_FIX supprimer  les mongo query
      // TODO_SECURITY_FIX session cookie plus permission
      // TODO_SECURITY_FIX enlever les données privées (dont last connection date)
      querystring: z
        .object({
          userQuery: z.string() /* mongo query */,
          formulaireQuery: z.string() /* mongo query */,
        })
        .strict(),
      response: {
        "200": z.array(
          ZUserRecruteur.extend({
            jobs: z.number().optional(), // TODO remplacer jobs par jobCount
            origin: z.string().optional(),
            job_detail: z.array(ZJob).optional(),
          }).strict()
        ),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/user": {
      // TODO ANY TO BE FIXED
      // TODO_SECURITY_FIX session admin only et changer le chemin vers /api/admin/user
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
    "/api/user/:userId": {
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
    "/api/user": {
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
    "/api/user/:userId": {
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
        "400": z.object({ error: z.boolean(), reason: z.string() }).strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/user/:userId/history": {
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
    "/api/user": {
      // TODO_SECURITY_FIX session et cookie + permissions
      // TODO return json format
      querystring: z
        .object({
          userId: zObjectId,
          recruiterId: zObjectId.optional(),
        })
        .strict(),
      response: {
        "200": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
