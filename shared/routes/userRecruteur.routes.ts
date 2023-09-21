import { z } from "zod"

import { ZJob } from "../models/job.model"
import { ZUserRecruteur, ZUserStatusValidation } from "../models/usersRecruteur.model"

export const zUserRecruteurRoutes = {
  get: {
    "/api/user/opco": {
      params: z.object({
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
    },
    "/api/user": {
      params: z.object({
        users: z.string() /* mongo query */,
      }),
      response: {
        "2xx": z.array(ZUserRecruteur),
      },
    },
  },
  post: {
    "/api/user": {
      params: ZUserRecruteur.extend({
        scope: z.string().optional(),
      }),
      response: {
        "2xx": ZUserRecruteur,
      },
    },
  },
  put: {
    "/api/user/:userId": {
      params: ZUserRecruteur.pick({
        last_name: true,
        first_name: true,
        phone: true,
        email: true,
        opco: true,
      }).partial(),
      response: {
        "2xx": ZUserRecruteur,
      },
    },
    "/api/user/:userId/history": {
      params: ZUserStatusValidation,
      response: {
        "2xx": ZUserRecruteur,
      },
    },
  },
  delete: {
    "/api/user": {
      params: z.object({
        userId: z.string(),
        recruiterId: z.string().optional(),
      }),
      response: {
        "2xx": null,
      },
    },
  },
}
