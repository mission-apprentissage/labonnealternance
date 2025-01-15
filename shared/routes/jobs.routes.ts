import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { ZEtablissementCatalogueProcheWithDistance } from "../interface/etablissement.types"
import { ZJob, ZJobFields, ZJobStartDateCreate } from "../models"
import { zObjectId } from "../models/common"
import { ZApiError, ZLbacError, ZLbarError } from "../models/lbacError.model"
import {
  ZLbaItemFtJob,
  ZLbaItemFtJobReturnedByAPI,
  ZLbaItemLbaCompany,
  ZLbaItemLbaCompanyReturnedByAPI,
  ZLbaItemLbaJob,
  ZLbaItemLbaJobReturnedByAPI,
  ZLbaItemPartnerJob,
  ZLbaItemPartnerJobReturnedByAPI,
} from "../models/lbaItem.model"
import { ZRecruiter } from "../models/recruiter.model"
import { rateLimitDescription } from "../utils/rateLimitDescription"

import {
  zCallerParam,
  zDiplomaParam,
  zInseeParams,
  ZLatitudeParam,
  ZLongitudeParam,
  zOpcoParams,
  zOpcoUrlParams,
  ZRadiusParam,
  zRefererHeaders,
  zRncpsParams,
  zRomesParams,
  zSourcesParams,
} from "./_params"
import { IRoutesDef, ZResError } from "./common.routes"

export const zV1JobsRoutes = {
  get: {
    "/v1/jobs/establishment": {
      method: "get",
      path: "/v1/jobs/establishment",
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
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Get existing establishment id from siret & email\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs/bulk": {
      method: "get",
      path: "/v1/jobs/bulk",
      // TODO_SECURITY_FIX
      querystring: z
        .object({
          query: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "query mongodb query allowing specific filtering, JSON stringified : {'status':'Actif'}",
              },
            }), // mongo query
          select: z
            .string()
            .optional()
            .openapi({
              param: {
                description: "select fields to return",
              },
              example: "{'_id': 1, 'first_name':1, 'last_name':0}",
            }), // mongo projection
          page: z.coerce
            .number()
            .min(1)
            .default(1)
            .optional()
            .openapi({
              param: {
                description: "the current page.",
              },
            }),
          limit: z.coerce
            .number()
            .max(100)
            .default(10)
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
            data: z.array(ZRecruiter.partial()).optional(),
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
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Get all jobs related to my organization\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs/delegations/:jobId": {
      method: "get",
      path: "/v1/jobs/delegations/:jobId",
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      response: {
        "200": z.array(ZEtablissementCatalogueProcheWithDistance),
        "4xx": z.union([ZLbarError, ZResError]),
      },
      securityScheme: {
        auth: "api-key",
        access: "job:manage",
        resources: { job: [{ _id: { type: "params", key: "jobId" } }] },
      },
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Get related training organization related to a job offer.\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs": {
      method: "get",
      path: "/v1/jobs",
      querystring: z
        .object({
          romes: zRomesParams("rncp"),
          rncp: zRncpsParams,
          caller: zCallerParam.nullish(),
          latitude: ZLatitudeParam,
          longitude: ZLongitudeParam,
          radius: ZRadiusParam,
          insee: zInseeParams,
          sources: zSourcesParams,
          diploma: zDiplomaParam,
          opco: zOpcoParams,
          opcoUrl: zOpcoUrlParams,
        })
        .strict()
        .passthrough(),
      headers: zRefererHeaders,
      response: {
        "200": z
          .object({
            partnerJobs: z.union([
              z
                .object({
                  results: z.array(ZLbaItemPartnerJob),
                })
                .strict()
                .nullable(),
              ZApiError,
            ]),
            peJobs: z.union([
              z
                .object({
                  results: z.array(ZLbaItemFtJob),
                })
                .strict()
                .nullable(),
              ZApiError,
            ]),
            matchas: z.union([
              z
                .object({
                  results: z.array(ZLbaItemLbaJob),
                })
                .strict()
                .nullable(),
              ZApiError,
            ]),
            lbaCompanies: z.union([
              z
                .object({
                  results: z.array(ZLbaItemLbaCompany),
                })
                .strict()
                .nullable(),
              ZApiError,
            ]),
            lbbCompanies: z.null(), // always null until removal
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError, ZApiError]),
        "500": z.union([ZResError, ZLbacError, ZApiError]),
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Get job opportunities matching the query parameters\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/_private/jobs/min": {
      method: "get",
      path: "/v1/_private/jobs/min",
      querystring: z
        .object({
          romes: zRomesParams("rncp"),
          rncp: zRncpsParams,
          caller: zCallerParam.nullish(),
          latitude: ZLatitudeParam,
          longitude: ZLongitudeParam,
          radius: ZRadiusParam,
          insee: zInseeParams,
          sources: zSourcesParams,
          diploma: zDiplomaParam,
          opco: zOpcoParams,
          opcoUrl: zOpcoUrlParams,
        })
        .strict()
        .passthrough(),
      headers: zRefererHeaders,
      response: {
        "200": z
          .object({
            partnerJobs: z.union([
              z
                .object({
                  results: z.array(ZLbaItemPartnerJob),
                })
                .strict()
                .nullable(),
              ZApiError,
            ]),
            peJobs: z.union([
              z
                .object({
                  results: z.array(ZLbaItemFtJob),
                })
                .strict()
                .nullable(),
              ZApiError,
            ]),
            matchas: z.union([
              z
                .object({
                  results: z.array(ZLbaItemLbaJob),
                })
                .strict()
                .nullable(),
              ZApiError,
            ]),
            lbaCompanies: z.union([
              z
                .object({
                  results: z.array(ZLbaItemLbaCompany),
                })
                .strict()
                .nullable(),
              ZApiError,
            ]),
            lbbCompanies: z.null(), // always null until removal
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError, ZApiError]),
        "500": z.union([ZResError, ZLbacError, ZApiError]),
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Get job opportunities matching the query parameters\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs/company/:siret": {
      method: "get",
      path: "/v1/jobs/company/:siret",
      params: z
        .object({
          siret: extensions.siret,
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
        "200": ZLbaItemLbaCompanyReturnedByAPI,
        "400": z.union([ZResError, ZLbacError, ZApiError]),
        "404": z.union([ZResError, ZLbacError, ZApiError]),
        "500": z.union([ZResError, ZLbacError, ZApiError]),
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Get one company identified by it's siret\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs/matcha/:id": {
      method: "get",
      path: "/v1/jobs/matcha/:id",
      params: z
        .object({
          id: zObjectId.openapi({
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
        "200": ZLbaItemLbaJobReturnedByAPI,
        //"419": le code correspondant a disparu. ticket bug ouvert
        "400": z.union([ZResError, ZLbacError, ZApiError]),
        "500": z.union([ZResError, ZLbacError, ZApiError]),
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Get one lba job identified by it's id\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs/partnerJob/:id": {
      method: "get",
      path: "/v1/jobs/partnerJob/:id",
      params: z
        .object({
          id: zObjectId.openapi({
            param: {
              description: "the id the partner job looked for.",
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
        "200": ZLbaItemPartnerJobReturnedByAPI,
        "400": z.union([ZResError, ZLbacError, ZApiError]),
        "500": z.union([ZResError, ZLbacError, ZApiError]),
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Get one lba job identified by it's id\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs/job/:id": {
      method: "get",
      path: "/v1/jobs/job/:id",
      params: z
        .object({
          id: z.string(),
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
        "200": ZLbaItemFtJobReturnedByAPI,
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Get one pe job identified by it's id\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
  },
  post: {
    "/v1/jobs/establishment": {
      method: "post",
      path: "/v1/jobs/establishment",
      body: z
        .object({
          establishment_siret: extensions.siret,
          first_name: z.string(),
          last_name: z.string(),
          phone: z
            .string()
            .trim()
            .regex(/^0[1-9]\d{8}$/)
            .optional(),
          email: z.string().email(),
          idcc: z.string().optional(),
          origin: z.string().optional().openapi({
            description:
              "always prefixed with you identification name declared at the API user creation. BETA GOUV with an origin set to 'campaign2023' will be betagouv-campaign2023.",
            example: "betagouv-campaign2023",
          }),
        })
        .strict(),
      response: {
        "201": ZRecruiter,
        "400": z.union([ZResError, ZLbarError]),
      },
      securityScheme: {
        auth: "api-key",
        access: { every: ["user:validate", "recruiter:manage", "user:manage"] },
        resources: {},
      },
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Create an establishment entity\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs/:establishmentId": {
      method: "post",
      path: "/v1/jobs/:establishmentId",
      params: z.object({ establishmentId: z.string() }).strict(),
      body: ZJobFields.pick({
        job_level_label: true,
        job_duration: true,
        job_type: true,
        job_count: true,
        job_rythm: true,
        job_employer_description: true,
        job_description: true,
        is_disabled_elligible: true,
        custom_address: true,
        custom_geo_coordinates: true,
        custom_job_title: true,
      })
        .extend({
          job_start_date: ZJobStartDateCreate(),
          appellation_code: z.string().regex(/^[0-9]+$/, "appelation code ne doit contenir que des chiffres"),
        })
        .strict()
        .refine(
          ({ custom_address, custom_geo_coordinates }) => {
            if ((custom_address !== undefined && custom_geo_coordinates === undefined) || (custom_address === undefined && custom_geo_coordinates !== undefined)) {
              return false
            }
            return true
          },
          { message: "custom_geo_coordinates est obligatoire si custom_address est passé en paramètre" }
        )
        .refine(
          ({ job_description }) => {
            if (job_description && job_description?.length < 30) {
              return false
            }
            return true
          },
          { message: "job_description doit avoir un minimum de 30 caractères" }
        )
        .refine(
          ({ job_employer_description }) => {
            if (job_employer_description && job_employer_description?.length < 30) {
              return false
            }
            return true
          },
          { message: "job_employer_description doit avoir un minimum de 30 caractères" }
        ),
      response: {
        "201": ZRecruiter,
        "400": z.union([ZResError, ZLbarError]),
      },
      securityScheme: {
        auth: "api-key",
        access: "recruiter:add_job",
        resources: {
          recruiter: [
            {
              establishment_id: { type: "params", key: "establishmentId" },
            },
          ],
        },
      },
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Create a job offer inside an establishment entity.\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs/delegations/:jobId": {
      method: "post",
      path: "/v1/jobs/delegations/:jobId",
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      body: z
        .object({
          establishmentIds: z.array(z.string()),
        })
        .strict(),
      response: {
        "200": ZRecruiter,
        "400": z.union([ZResError, ZLbarError]),
      },
      securityScheme: {
        auth: "api-key",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: "Create delegation related to a job offer.",
      },
    },
    "/v1/jobs/provided/:jobId": {
      method: "post",
      path: "/v1/jobs/provided/:jobId",
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      response: {
        "204": z.object({}).strict(),
      },
      securityScheme: {
        auth: "api-key",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Update a job offer status to Provided\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs/canceled/:jobId": {
      method: "post",
      path: "/v1/jobs/canceled/:jobId",
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      response: {
        "204": z.object({}).strict(),
      },
      securityScheme: {
        auth: "api-key",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Update a job offer status to Canceled\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs/extend/:jobId": {
      method: "post",
      path: "/v1/jobs/extend/:jobId",
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      response: {
        "204": z.object({}).strict(),
      },
      securityScheme: {
        auth: "api-key",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Update a job expiration date by 30 days.\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/v1/jobs/matcha/:id/stats/view-details": {
      method: "post",
      path: "/v1/jobs/matcha/:id/stats/view-details",
      params: z
        .object({
          id: zObjectId,
        })
        .strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: null,
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Notifies that the detail of a matcha job has been viewed\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
  },
  patch: {
    "/v1/jobs/:jobId": {
      method: "patch",
      path: "/v1/jobs/:jobId",
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      body: ZJob.pick({
        job_level_label: true,
        job_duration: true,
        job_type: true,
        is_disabled_elligible: true,
        job_count: true,
        job_rythm: true,
        job_employer_description: true,
        job_description: true,
        custom_address: true,
        custom_geo_coordinates: true,
      })
        .extend({
          job_start_date: ZJobStartDateCreate(),
        })
        .partial(),
      response: {
        "200": ZRecruiter,
        "400": z.union([ZResError, ZLbarError]),
      },
      securityScheme: {
        auth: "api-key",
        access: "job:manage",
        resources: {
          job: [{ _id: { type: "params", key: "jobId" } }],
        },
      },
      openapi: {
        tags: ["V1 - Jobs"] as string[],
        deprecated: true,
        description: `Update a job offer specific fields inside an establishment entity.\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
  },
} as const satisfies IRoutesDef
