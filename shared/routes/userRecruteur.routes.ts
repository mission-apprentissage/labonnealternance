import { z } from "zod"

import { ZJob } from "../models/job.model"
import { ZUserRecruteur, ZUserStatusValidation } from "../models/usersRecruteur.model"

import { IRoutesDef } from "./common.routes"

export const zUserRecruteurRoutes = {
  get: {
    "/api/user/opco": {
      querystring: z.object({
        userQuery: z.string() /* mongo query */,
        formulaireQuery: z.string() /* mongo query */,
      }),
      response: {
        "2xx": z.array(
          ZUserRecruteur.extend({
            offres: z.number(), // toujours 0, wtf ?
            jobs: z.number().optional(),
            origin: z.string().optional(),
            job_detail: z.array(ZJob).optional(),
          })
        ),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/user": {
      querystring: z.object({
        users: z.string() /* mongo query */,
      }),
      response: {
        "2xx": z.array(ZUserRecruteur),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  post: {
    "/api/user": {
      querystring: ZUserRecruteur.extend({
        scope: z.string().optional(),
      }),
      response: {
        "2xx": ZUserRecruteur,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  put: {
    "/api/user/:userId": {
      querystring: ZUserRecruteur.pick({
        last_name: true,
        first_name: true,
        phone: true,
        email: true,
        opco: true,
      }).partial(),
      response: {
        "2xx": ZUserRecruteur,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/user/:userId/history": {
      querystring: ZUserStatusValidation,
      response: {
        "2xx": ZUserRecruteur,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  delete: {
    "/api/user": {
      querystring: z.object({
        userId: z.string(),
        recruiterId: z.string().optional(),
      }),
      response: {
        "2xx": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
