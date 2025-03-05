import { zObjectId } from "zod-mongodb-schema"

import { z } from "../../../helpers/zodWithOpenApi.js"
import { IRoutesDef } from "../../common.routes.js"

import { zJobOfferApiReadV3, zJobOfferApiWriteV3, zJobSearchApiV3Query, zJobSearchApiV3Response } from "./jobs.routes.v3.model.js"

export const zJobsRoutesV3 = {
  get: {
    "/v3/jobs/search": {
      method: "get",
      path: "/v3/jobs/search",
      querystring: zJobSearchApiV3Query,
      response: {
        "200": zJobSearchApiV3Response,
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
    "/v3/jobs/:id": {
      method: "get",
      path: "/v3/jobs/:id",
      params: z.object({
        id: zObjectId,
      }),
      response: {
        "200": zJobOfferApiReadV3,
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
    "/v3/jobs/multi-partner": {
      method: "post",
      path: "/v3/jobs/multi-partner",
      body: zJobOfferApiWriteV3.extend({
        partner_label: z.string(),
        partner_job_id: z.string(),
      }),
      response: {
        "200": z.object({ id: zObjectId }),
      },
      securityScheme: {
        auth: "api-key",
        access: null,
        resources: {},
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
