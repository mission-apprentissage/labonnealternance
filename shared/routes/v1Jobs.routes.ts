import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { zObjectId } from "../models/common"
import { ZLbaItem } from "../models/lbaItem.model"
import { ZRecruiter } from "../models/recruiter.model"

import { IRoutesDef } from "./common.routes"

export const zV1JobsRoutes = {
  get: {
    "/api/v1/jobs/establishment": {
      querystring: z
        .object({
          establishment_siret: extensions.siret(),
          email: z.string().email(),
        })
        .strict(),
      response: {
        "200": z.string(),
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
    "/api/v1/jobs/bulk": {
      querystring: z
        .object({
          query: z.string().optional(), // mongo query
          select: z.string().optional(), // mongo projection
          page: z.number().optional(),
          limit: z.number().optional(),
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
    "/api/v1/jobs/delegations/:jobId": {
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      response: {
        "200": z
          .object({
            _id: z.string(),
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
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
    "/api/v1/jobs": {
      querystring: z
        .object({
          romes: z.string().optional(),
          rncp: z.string().optional(),
          caller: z.string().optional(),
          latitude: z.string().optional(),
          longitude: z.string().optional(),
          radius: z.string().optional(),
          insee: z.string().optional(),
          sources: z.string().optional(),
          diploma: z.string().optional(),
          opco: z.string().optional(),
          opcoUrl: z.string().optional(),
          referer: z.string().optional(), // hidden
          useMock: z.string().optional(), // hidden
        })
        .strict(),
      response: {
        "200": z
          .object({
            job_count: z.number(),
            peJobs: z
              .object({
                results: z.array(ZLbaItem),
              })
              .strict()
              .nullable(),
            matchas: z
              .object({
                results: z.array(ZLbaItem),
              })
              .strict()
              .nullable(),
            lbaCompanies: z
              .object({
                results: z.array(ZLbaItem),
              })
              .strict()
              .nullable(),
            lbbCompanies: z.null(), // always null ???
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/jobs/company/:siret": {
      params: z
        .object({
          siret: extensions.siret(),
        })
        .strict(),
      querystring: z
        .object({
          caller: z.string().optional(),
          referer: z.string().optional(), // hidden
        })
        .strict(),
      response: {
        "200": z
          .object({
            lbaCompanies: z.array(ZLbaItem),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/jobs/matcha/:id": {
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
      response: {
        "200": z
          .object({
            matchas: z.array(ZLbaItem),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/v1/jobs/job/:id": {
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
      response: {
        "200": z
          .object({
            peJobs: z.array(ZLbaItem),
          })
          .strict(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  post: {
    "/api/v1/jobs/establishment": {
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
        "200": ZRecruiter,
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
    "/api/v1/jobs/:establishmentId": {
      params: z
        .object({
          establishmentId: z.string(),
        })
        .strict(),
      body: z
        .object({
          job_level_label: z.string(),
          job_duration: z.number(),
          job_type: z.array(z.string()),
          is_disabled_elligible: z.boolean(),
          job_count: z.number().optional(),
          job_rythm: z.string().optional(),
          job_start_date: z.string(),
          job_employer_description: z.string().optional(),
          job_description: z.string().optional(),
          custom_address: z.string().optional(),
          custom_geo_coordinates: z.string().optional(),
          appellation_code: z.string(),
        })
        .strict(),
      response: {
        "200": ZRecruiter,
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
    "/api/v1/jobs/delegations/:jobId": {
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
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
    "/api/v1/jobs/provided/:jobId": {
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      response: {
        "200": z.undefined(),
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
    "/api/v1/jobs/canceled/:jobId": {
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      response: {
        "200": z.undefined(),
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
    "/api/v1/jobs/extend/:jobId": {
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      response: {
        "200": z.undefined(),
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
    "/api/v1/jobs/matcha/:id/stats/view-details": {
      params: z
        .object({
          id: z.string(),
        })
        .strict(),
      response: {
        "200": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  patch: {
    "/api/v1/jobs/:jobId": {
      params: z
        .object({
          jobId: zObjectId,
        })
        .strict(),
      body: z
        .object({
          job_level_label: z.string(),
          job_duration: z.number(),
          job_type: z.array(z.string()),
          is_disabled_elligible: z.boolean(),
          job_count: z.number().optional(),
          job_rythm: z.string().optional(),
          job_start_date: z.string(),
          job_employer_description: z.string().optional(),
          job_description: z.string().optional(),
          custom_address: z.string().optional(),
          custom_geo_coordinates: z.string().optional(),
        })
        .strict(),
      response: {
        "200": ZRecruiter,
      },
      securityScheme: {
        auth: "api-key",
        role: "all",
      },
    },
  },
} satisfies IRoutesDef
