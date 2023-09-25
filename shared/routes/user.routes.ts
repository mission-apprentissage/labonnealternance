import { z } from "zod"

import { ZJob } from "../models/job.model"
import { ZRecruiter } from "../models/recruiter.model"
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
    },
    "/api/user": {
      querystring: z
        .object({
          users: z.string() /* mongo query */,
        })
        .strict(),
      response: {
        "200": z.array(ZUserRecruteur),
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
        "200": ZUserRecruteur.extend(ZRecruiter.shape),
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
    },
  },
  put: {
    "/api/user/:userId": {
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
        "200": ZUserRecruteur,
      },
    },
    "/api/user/:userId/history": {
      querystring: ZUserStatusValidation,
      response: {
        "200": ZUserRecruteur,
      },
    },
  },
  delete: {
    "/api/user": {
      querystring: z
        .object({
          userId: z.string(),
          recruiterId: z.string().optional(),
        })
        .strict(),
      response: {
        "200": z.undefined(),
      },
    },
  },
} as const satisfies IRoutesDef
