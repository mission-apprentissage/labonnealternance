import { z } from "../../../helpers/zodWithOpenApi"
import { zObjectId } from "../../../models/common"
import { IRoutesDef } from "../../common.routes"
import { ZJobOpportunityGetQuery } from "../../jobOpportunity.routes"

import { zJobSearchApiV3, zJobOfferApiWriteV3 } from "./jobs.routes.v3.model"

export const zJobsRoutesV3 = {
  get: {
    "/v3/jobs/search": {
      method: "get",
      path: "/v3/jobs/search",
      querystring: ZJobOpportunityGetQuery,
      response: {
        "200": zJobSearchApiV3,
      },
      securityScheme: {
        auth: "api-apprentissage",
        access: null,
        resources: {},
      },
      openapi: {
        tags: ["V3 - Jobs"] as string[],
      },
    },
  },
  post: {
    "/v3/jobs": {
      method: "post",
      path: "/v3/jobs",
      body: zJobOfferApiWriteV3,
      response: {
        "200": z.object({ id: zObjectId }),
      },
      securityScheme: {
        auth: "api-apprentissage",
        access: "api-apprentissage:jobs",
        resources: {},
      },
      openapi: {
        tags: ["V3 - Jobs"] as string[],
      },
    },
  },
  put: {
    "/v3/jobs/:id": {
      method: "put",
      path: "/v3/jobs/:id",
      params: z.object({
        id: zObjectId,
      }),
      body: zJobOfferApiWriteV3,
      response: {
        "204": z.null(),
      },
      securityScheme: {
        auth: "api-apprentissage",
        access: "api-apprentissage:jobs",
        resources: {
          jobPartner: [{ _id: { type: "params", key: "id" } }],
        },
      },
      openapi: {
        tags: ["V3 - Jobs"] as string[],
      },
    },
  },
} as const satisfies IRoutesDef
