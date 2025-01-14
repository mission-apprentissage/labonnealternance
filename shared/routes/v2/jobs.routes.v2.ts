import { LBA_ITEM_TYPE } from "../../constants/lbaitem"
import { extensions } from "../../helpers/zodHelpers/zodPrimitives"
import { z } from "../../helpers/zodWithOpenApi"
import { zObjectId } from "../../models/common"
import { ZLbarError } from "../../models/lbacError.model"
import { ZLbaItemFtJob, ZLbaItemLbaJob } from "../../models/lbaItem.model"
import { ZRecruiter } from "../../models/recruiter.model"
import { rateLimitDescription } from "../../utils/rateLimitDescription"
import { zCallerParam, zRefererHeaders, zSourcesParams } from "../_params"
import { IRoutesDef, ZResError } from "../common.routes"

export const zJobsRoutesV2 = {
  get: {
    "/v2/jobs/establishment": {
      method: "get",
      path: "/v2/jobs/establishment",
      querystring: z
        .object({
          establishment_siret: extensions.siret,
          email: z
            .string()
            .email()
            .openapi({
              param: {
                description: "Establishment email",
              },
            }),
        })
        .strict(),
      response: {
        "200": z.string().openapi({
          description: "Etablishment id",
        }),
        "400": z.union([ZResError, ZLbarError]).openapi({
          description: "Bad Request",
        }),
      },
      securityScheme: {
        auth: "api-key",
        access: "recruiter:manage",
        resources: { recruiter: [{ establishment_siret: { type: "query", key: "establishment_siret" }, email: { type: "query", key: "email" } }] },
      },
      openapi: {
        tags: ["V2 - Jobs"] as string[],
        description: `Get existing establishment id from siret & email\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v2/jobs/bulk": {
      method: "get",
      path: "/v2/jobs/bulk",
      querystring: z
        .object({
          query: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "query mongodb query allowing specific filtering, JSON stringified",
              },
            }), // mongo query
          select: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "select fields to return",
              },
              example: "{_id: 1, first_name:1, last_name:0}",
            }), // mongo projection
          page: z.coerce
            .number()
            .optional()
            .openapi({
              param: {
                description: "the current page.",
              },
            }),
          limit: z.coerce
            .number()
            .optional()
            .openapi({
              param: {
                description: "the limit of results per page",
              },
            }),
        })
        .strict(),
      response: {
        "200": z
          .object({
            data: z.array(ZRecruiter).optional(),
            pagination: z
              .object({
                page: z.number().optional(),
                result_per_page: z.number().optional(),
                number_of_page: z.number().optional(),
                total: z.number().optional(),
              })
              .strict(),
          })
          .strict(),
      },
      securityScheme: {
        auth: "api-key",
        access: null,
        resources: {},
      },
      openapi: {
        tags: ["V2 - Jobs"] as string[],
        description: `Get all jobs related to my organization\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
        operationId: "getJobs",
      },
    },
    "/v2/jobs/:source/:id": {
      method: "get",
      path: "/v2/jobs/:source/:id",
      params: z
        .object({
          source: zSourcesParams,
          id: z.string().openapi({
            param: {
              description: "the id the lba job looked for.",
            },
          }),
        })
        .strict(),
      querystring: z
        .object({
          caller: zCallerParam,
        })
        .strict()
        .passthrough(),
      headers: zRefererHeaders,
      response: {
        "200": z.union([
          z
            .object({
              job: z.union([z.array(ZLbaItemLbaJob), ZLbaItemFtJob]),
            })
            .strict(),
          z.null(),
        ]),
      },
      securityScheme: {
        auth: "api-key",
        access: null,
        resources: {},
      },
      openapi: {
        tags: ["V2 - Jobs"] as string[],
        operationId: "getLbaJob",
        description: `Get one lba job identified by it's id\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v2/jobs/export": {
      method: "get",
      path: "/v2/jobs/export",
      querystring: z
        .object({
          source: z.enum([LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.RECRUTEURS_LBA]),
        })
        .strict(),
      response: {
        "200": z.string(),
      },
      securityScheme: {
        auth: "api-key",
        access: null,
        resources: {},
      },
      openapi: {
        tags: ["V2 - Jobs"] as string[],
        operationId: "getLbaJobExportFile",
        description: `Get a S3 link of the full JSON export of lba recruters and lba job offers. The link generated is valid for 2 minutes.\n${rateLimitDescription({
          max: 1,
          timeWindow: "1s",
        })}`,
      },
    },
  },
  post: {
    "/v2/jobs/provided/:id": {
      method: "post",
      path: "/v2/jobs/provided/:id",
      params: z
        .object({
          id: zObjectId,
        })
        .strict(),
      response: {
        "204": z.object({}).strict(),
      },
      securityScheme: {
        auth: "api-apprentissage",
        access: null,
        resources: {},
      },
    },
    "/v2/jobs/canceled/:id": {
      method: "post",
      path: "/v2/jobs/canceled/:id",
      params: z
        .object({
          id: zObjectId,
        })
        .strict(),
      response: {
        "204": z.object({}).strict(),
      },
      securityScheme: {
        auth: "api-apprentissage",
        access: null,
        resources: {},
      },
    },
    "/v2/jobs/extend/:id": {
      method: "post",
      path: "/v2/jobs/extend/:id",
      params: z
        .object({
          id: zObjectId,
        })
        .strict(),
      response: {
        "204": z.object({}).strict(),
      },
      securityScheme: {
        auth: "api-apprentissage",
        access: null,
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
