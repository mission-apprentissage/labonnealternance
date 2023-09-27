import { z } from "zod"

import { zObjectId } from "../models/common"
import { ZJob } from "../models/job.model"
import { ZUserRecruteur, ZUserStatusValidation } from "../models/usersRecruteur.model"

import { IRoutesDef } from "./common.routes"

export const zUserRecruteurRoutes = {
  get: {
    "/api/user/opco": {
      querystring: z
        .object({
          userQuery: z.string() /* mongo query */,
          formulaireQuery: z.string() /* mongo query */,
        })
        .strict(),
      response: {
        "200": z.array(
          ZUserRecruteur.extend({
            offres: z.number(), // toujours 0, wtf ?
            jobs: z.number().optional(),
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
      params: z
        .object({
          userId: z.string(),
        })
        .strict(),
      response: {
        "200": ZUserRecruteur.extend({ jobs: z.array(ZJob) }),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  post: {
    "/api/user": {
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
      params: z.object({ userId: zObjectId }).strict(),
      body: ZUserStatusValidation,
      response: {
        "200": ZUserRecruteur,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  delete: {
    "/api/user": {
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
