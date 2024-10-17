import { z } from "../helpers/zodWithOpenApi"
import { ZApplicationApiJobId, ZApplicationApiRecruteurId, ZApplicationPrivateCompanySiret, ZApplicationPrivateJobId } from "../models"

import { IRoutesDef } from "./common.routes"

export const zApplicationRoutesV2 = {
  post: {
    "/application": {
      path: "/application",
      method: "post",
      body: z.union([ZApplicationApiRecruteurId, ZApplicationApiJobId]),
      response: {
        "202": z.object({
          id: z.string(),
        }),
      },
      securityScheme: { auth: "api-apprentissage", access: null, resources: {} },
    },
    "/_private/application": {
      path: "/_private/application",
      method: "post",
      body: z.union([ZApplicationPrivateCompanySiret, ZApplicationPrivateJobId]),
      response: {
        "200": z.object({}),
      },
      securityScheme: {
        auth: "access-token",
        access: null,
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
