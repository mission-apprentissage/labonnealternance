import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"
import { ZJob } from "../models"
import { zObjectId } from "../models/common"
import { ZApiError, ZLbacError, ZLbarError } from "../models/lbacError.model"
import { ZLbaItemLbaCompany, ZLbaItemLbaJob, ZLbaItemPeJob } from "../models/lbaItem.model"
import { ZRecruiter } from "../models/recruiter.model"

import {
  zCallerParam,
  zDiplomaParams,
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
      querystring: z
        .object({
          establishment_siret: extensions.siret(),
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
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        description: "Get existing establishment id from siret & email",
      },
    },
    "/v1/jobs/bulk": {
      // TODO_SECURITY_FIX il faut faire quelque chose car sinon nous allons claquer des fesses
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
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        description: "Get all jobs related to my organization",
        operationId: "getJobs",
      },
    },
    "/v1/jobs/delegations/:jobId": {
      // TODO_SECURITY_FIX scoper le retour aux seules offres de l'utilisateur (permissions jobid pour l'utilisateur connecté)
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      response: {
        "200": z
          .object({
            _id: zObjectId,
            numero_voie: z.string(),
            type_voie: z.string(),
            nom_voie: z.string(),
            code_postal: z.string(),
            nom_departement: z.string(),
            entreprise_raison_sociale: z.string(),
            geo_coordonnees: z.string(),
            distance_en_km: z.number(),
          })
          .strict(),
        "4xx": z.union([ZLbarError, ZResError]),
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        operationId: "getDelegation",
        description: "Get related training organization related to a job offer.",
      },
    },
    "/v1/jobs": {
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
          diploma: zDiplomaParams,
          opco: zOpcoParams,
          opcoUrl: zOpcoUrlParams,
        })
        .strict(),
      headers: zRefererHeaders,
      response: {
        "200": z
          .object({
            peJobs: z.union([
              z
                .object({
                  results: z.array(ZLbaItemPeJob),
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
        "400": z.union([ZResError, ZLbacError]),
        "500": z.union([ZResError, ZApiError]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        operationId: "getJobOpportunities",
        description: "Get job opportunities matching the query parameters",
      },
    },
    "/v1/jobs/company/:siret": {
      params: z
        .object({
          siret: extensions.siret(),
        })
        .strict(),
      querystring: z
        .object({
          caller: zCallerParam,
          type: z.string().nullish(),
        })
        .strict(),
      headers: zRefererHeaders,
      response: {
        "200": z
          .object({
            lbaCompanies: z.array(ZLbaItemLbaCompany),
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError]),
        "404": z.union([ZResError, ZLbacError]),
        "500": z.union([ZResError, ZLbacError]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        operationId: "getCompany",
        description: "Get one company identified by it's siret",
      },
    },
    "/v1/jobs/matcha/:id": {
      params: z
        .object({
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
        .strict(),
      headers: zRefererHeaders,
      response: {
        "200": z
          .object({
            matchas: z.array(ZLbaItemLbaJob),
          })
          .strict(),
        //"419": le code correspondant a disparu. ticket bug ouvert
        "400": z.union([ZResError, ZLbacError]),
        "500": z.union([ZResError, ZLbacError]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        operationId: "getLbaJob",
        description: "Get one lba job identified by it's id",
      },
    },
    "/v1/jobs/job/:id": {
      params: z
        .object({
          id: z.string(),
        })
        .strict(),
      querystring: z
        .object({
          caller: zCallerParam,
        })
        .strict(),
      headers: zRefererHeaders,
      response: {
        "200": z
          .object({
            peJobs: z.array(ZLbaItemPeJob),
          })
          .strict(),
        "400": z.union([ZResError, ZLbacError]),
        "404": z.union([ZResError, ZLbacError]),
        "500": z.union([ZResError, ZLbacError]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        operationId: "getPeJob",
        description: "Get one pe job identified by it's id",
      },
    },
  },
  post: {
    "/v1/jobs/establishment": {
      body: z
        .object({
          establishment_siret: extensions.siret(),
          first_name: z.string(),
          last_name: z.string(),
          phone: extensions.phone().optional(),
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
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        description: "Create an establishment entity",
        operationId: "createEstablishment",
      },
    },
    "/v1/jobs/:establishmentId": {
      params: z
        .object({
          establishmentId: z.string(),
        })
        .strict(),
      body: z
        .object({
          job_level_label: z.string(),
          job_duration: z.number(),
          job_type: z.array(z.enum(["Apprentissage", "Professionnalisation"])),
          is_disabled_elligible: z.boolean(),
          job_count: z.number().optional(),
          job_rythm: z.string().optional(),
          job_start_date: z.date(),
          job_employer_description: z.string().optional(),
          job_description: z.string().optional(),
          custom_address: z.string().optional(),
          custom_geo_coordinates: z.string().optional(),
          appellation_code: z.string(),
        })
        .strict(),
      response: {
        "201": ZRecruiter,
        "400": z.union([ZResError, ZLbarError]),
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        description: "Create a job offer inside an establishment entity.",
        operationId: "createJob",
      },
    },
    "/v1/jobs/delegations/:jobId": {
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
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        operationId: "createDelegation",
        description: "Create delegation related to a job offer.",
      },
    },
    "/v1/jobs/provided/:jobId": {
      // TODO_SECURITY_FIX vérifier le scope au moment de l'update du statut de l'offre
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
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        description: 'Update a job offer status to "Provided"',
        operationId: "setJobAsProvided",
      },
    },
    "/v1/jobs/canceled/:jobId": {
      // TODO_SECURITY_FIX vérifier le scope au moment de l'update du statut de l'offre
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
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        operationId: "setJobAsCanceled",
        description: 'Update a job offer status to "Canceled".',
      },
    },
    "/v1/jobs/extend/:jobId": {
      // TODO_SECURITY_FIX vérifier le scope au moment de l'update du statut de l'offre
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
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        operationId: "extendJobExpiration",
        description: "Update a job expiration date by 30 days.",
      },
    },
    "/v1/jobs/matcha/:id/stats/view-details": {
      params: z
        .object({
          id: zObjectId,
        })
        .strict(),
      response: {
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        operationId: "statsViewLbaJob",
        description: "Notifies that the detail of a matcha job has been viewed",
      },
    },
  },
  patch: {
    "/v1/jobs/:jobId": {
      // TODO_SECURITY_FIX vérifier le scope au moment de l'update du statut de l'offre
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
        job_start_date: true,
        job_employer_description: true,
        job_description: true,
        custom_address: true,
        custom_geo_coordinates: true,
      }).partial(),
      response: {
        "200": ZRecruiter,
        "400": z.union([ZResError, ZLbarError]),
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
      openapi: {
        tags: ["Jobs"] as string[],
        operationId: "updateJob",
        description: "Update a job offer specific fields inside an establishment entity.",
      },
    },
  },
} as const satisfies IRoutesDef
