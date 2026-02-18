import { zObjectId } from "zod-mongodb-schema"
import { z } from "../../helpers/zodWithOpenApi.js"
import type { IRoutesDef } from "../common.routes.js"

export const zJobsRoutesV2 = {
  post: {
    "/v2/_private/jobs/provided/:id": {
      method: "post",
      path: "/v2/_private/jobs/provided/:id",
      params: z
        .object({
          id: zObjectId,
        })
        .strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
    "/v2/_private/jobs/canceled/:id": {
      method: "post",
      path: "/v2/_private/jobs/canceled/:id",
      params: z
        .object({
          id: zObjectId,
        })
        .strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
