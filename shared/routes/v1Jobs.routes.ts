import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { ZJob } from "../models"
import { zObjectId } from "../models/common"
import { ZApiError, ZLbacError, ZLbarError } from "../models/lbacError.model"
import { ZLbaItemLbaCompany, ZLbaItemLbaJob, ZLbaItemPeJob } from "../models/lbaItem.model"
import { ZRecruiter } from "../models/recruiter.model"

import { zRefererHeaders } from "./_params"
import { IRoutesDef, ZResError } from "./common.routes"

export const zV1JobsRoutes = {
  get: {
    "/v1/jobs/establishment": {
      querystring: z
        .object({
          establishment_siret: extensions.siret(),
          email: z.string().email(),
        })
        .strict(),
      response: {
        "200": z.string(),
        "400": ZLbarError,
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
    "/v1/jobs/bulk": {
      // TODO_SECURITY_FIX il faut faire quelque chose car sinon nous allons claquer des fesses
      querystring: z
        .object({
          query: z.string().optional(), // mongo query
          select: z.string().optional(), // mongo projection
          page: z.coerce.number().optional(),
          limit: z.coerce.number().optional(),
        })
        .strict(),
      response: {
        "200": z
          .object({
            data: z.array(ZRecruiter).or(z.undefined()),
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
        "4xx": ZLbarError,
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
    "/v1/jobs": {
      querystring: z
        .object({
          romes: z.string().optional(),
          rncp: z.string().optional(),
          caller: z.string().optional(),
          latitude: z.coerce.number().optional(),
          longitude: z.coerce.number().optional(),
          radius: z.coerce.number().optional(),
          insee: z.string().optional(),
          sources: z.string().optional(),
          diploma: z.string().optional(),
          opco: z.string().optional(),
          opcoUrl: z.string().optional(),
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
        "500": z.union([
          ZResError,
          z
            .object({
              error: z.string(),
              error_messages: z.array(z.string()).optional(),
              result: z.string().optional(),
              message: z.unknown().optional(),
              status: z.number().optional(),
              statusText: z.string().optional(),
            })
            .strict(),
        ]),
      },
      securityScheme: {
        auth: "none",
        role: "all",
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
          caller: z.string().optional(),
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
    },
    "/v1/jobs/matcha/:id": {
      params: z
        .object({
          id: z.string(),
        })
        .strict(),
      querystring: z
        .object({
          caller: z.string().optional(),
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
    },
    "/v1/jobs/job/:id": {
      params: z
        .object({
          id: z.string(),
        })
        .strict(),
      querystring: z
        .object({
          caller: z.string().optional(),
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
          origin: z.string().optional(),
        })
        .strict(),
      response: {
        "201": ZRecruiter,
        "400": ZLbarError,
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
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
        "400": ZLbarError,
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
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
        "400": ZLbarError,
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
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
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
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
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
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
        "200": z.object({}).strict(),
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
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
        "400": ZLbarError,
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
