import { LBA_ITEM_TYPE } from "../constants/lbaitem"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { ZJob, ZJobFields, ZJobStartDateCreate } from "../models"
import { zObjectId } from "../models/common"
import { ZJobsOpportunityResponse } from "../models/jobsPartners.model"
import { ZApiError, ZLbacError, ZLbarError } from "../models/lbacError.model"
import { ZLbaItemFtJob, ZLbaItemLbaCompany, ZLbaItemLbaJob } from "../models/lbaItem.model"
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
import { ZJobOpportunityRncp, ZJobOpportunityRome } from "./jobOpportunity.routes"

export const zJobsRoutesV2 = {
  get: {
    "/jobs/establishment": {
      method: "get",
      path: "/jobs/establishment",
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
    "/jobs/bulk": {
      method: "get",
      path: "/jobs/bulk",
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
    "/jobs/delegations/:jobId": {
      method: "get",
      path: "/jobs/delegations/:jobId",
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      response: {
        "200": z.array(
          z
            .object({
              _id: zObjectId,
              numero_voie: z.string().nullish(),
              type_voie: z.string().nullish(),
              nom_voie: z.string().nullish(),
              code_postal: z.string(),
              nom_departement: z.string(),
              entreprise_raison_sociale: z.string(),
              geo_coordonnees: z.string(),
              distance_en_km: z.number(),
            })
            .strict()
        ),
        "4xx": z.union([ZLbarError, ZResError]),
      },
      securityScheme: {
        auth: "api-key",
        access: "job:manage",
        resources: { job: [{ _id: { type: "params", key: "jobId" } }] },
      },
      openapi: {
        tags: ["V2 - Jobs"] as string[],
        operationId: "getDelegation",
        description: `Get related training organization related to a job offer.\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/jobs": {
      method: "get",
      path: "/jobs",
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
      securityScheme: {
        auth: "api-apprentissage",
        access: null,
        resources: {},
      },
      openapi: {
        tags: ["V2 - Jobs"] as string[],
        operationId: "getJobOpportunities",
        description: `Get job opportunities matching the query parameters\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/jobs/min": {
      method: "get",
      path: "/jobs/min",
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
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError, ZApiError]),
        "500": z.union([ZResError, ZLbacError, ZApiError]),
      },
      securityScheme: {
        auth: "api-key",
        access: null,
        resources: {},
      },
      openapi: {
        tags: ["V2 - Jobs - Min"] as string[],
        operationId: "getJobOpportunities",
        description: `Get job opportunities matching the query parameters and returns minimal data\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/jobs/entreprise_lba/:siret": {
      method: "get",
      path: "/jobs/entreprise_lba/:siret",
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
        "200": z
          .object({
            lbaCompanies: z.array(ZLbaItemLbaCompany),
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError, ZApiError]),
        "404": z.union([ZResError, ZLbacError, ZApiError]),
        "500": z.union([ZResError, ZLbacError, ZApiError]),
      },
      securityScheme: {
        auth: "api-key",
        access: null,
        resources: {},
      },
      openapi: {
        tags: ["V2 - Jobs"] as string[],
        operationId: "getCompany",
        description: `Get one company identified by it's siret\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/jobs/:source/:id": {
      method: "get",
      path: "/jobs/:source/:id",
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
    "/jobs/export": {
      method: "get",
      path: "/jobs/export",
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
    "/jobs/rome": {
      method: "get",
      path: "/jobs/rome",
      querystring: ZJobOpportunityRome,
      response: {
        "200": ZJobsOpportunityResponse,
      },
      securityScheme: {
        auth: "api-apprentissage",
        access: null,
        resources: {},
      },
    },
    "/jobs/rncp": {
      method: "get",
      path: "/jobs/rncp",
      querystring: ZJobOpportunityRncp,
      response: {
        "200": ZJobsOpportunityResponse,
      },
      securityScheme: {
        auth: "api-apprentissage",
        access: null,
        resources: {},
      },
    },
  },
  post: {
    "/jobs/establishment": {
      method: "post",
      path: "/jobs/establishment",
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
        tags: ["V2 - Jobs"] as string[],
        description: `Create an establishment entity\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
        operationId: "createEstablishment",
      },
    },
    "/jobs/:establishmentId": {
      method: "post",
      path: "/jobs/:establishmentId",
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
        is_multi_published: true,
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
        tags: ["V2 - Jobs"] as string[],
        description: `Create a job offer inside an establishment entity.\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
        operationId: "createJob",
      },
    },
    "/jobs/delegations/:jobId": {
      method: "post",
      path: "/jobs/delegations/:jobId",
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
        tags: ["V2 - Jobs"] as string[],
        operationId: "createDelegation",
        description: "Create delegation related to a job offer.",
      },
    },
    "/jobs/provided/:jobId": {
      method: "post",
      path: "/jobs/provided/:jobId",
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
        tags: ["V2 - Jobs"] as string[],
        description: `Update a job offer status to Provided\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
        operationId: "setJobAsProvided",
      },
    },
    "/jobs/canceled/:jobId": {
      method: "post",
      path: "/jobs/canceled/:jobId",
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
        tags: ["V2 - Jobs"] as string[],
        operationId: "setJobAsCanceled",
        description: `Update a job offer status to Canceled\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/jobs/extend/:jobId": {
      method: "post",
      path: "/jobs/extend/:jobId",
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
        tags: ["V2 - Jobs"] as string[],
        operationId: "extendJobExpiration",
        description: `Update a job expiration date by 30 days.\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
    "/jobs/matcha/:id/stats/view-details": {
      method: "post",
      path: "/jobs/matcha/:id/stats/view-details",
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
        tags: ["V2 - Jobs"] as string[],
        operationId: "statsViewLbaJob",
        description: `Notifies that the detail of a matcha job has been viewed\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
  },
  patch: {
    "/jobs/:jobId": {
      method: "patch",
      path: "/jobs/:jobId",
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
        tags: ["V2 - Jobs"] as string[],
        operationId: "updateJob",
        description: `Update a job offer specific fields inside an establishment entity.\n${rateLimitDescription({ max: 5, timeWindow: "1s" })}`,
      },
    },
  },
} as const satisfies IRoutesDef
