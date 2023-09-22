import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { zObjectId } from "../models/common"
import { ZLbaItem } from "../models/lbaItem.model"
import { ZRecruiter } from "../models/recruiter.model"
import { ZUserRecruteur } from "../models/usersRecruteur.model"

export const zV1JobsRoutes = {
  get: {
    "/api/v1/jobs/establishment": {
      queryParams: z.object({
        establishment_siret: extensions.siret(),
        email: z.string().email(),
      }),
      response: {
        "2xx": z.object({
          token: z.string(),
        }),
      },
    },
    "/api/v1/jobs/bulk": {
      queryParams: z.object({
        query: z.string().optional(), // mongo query
        select: z.string().optional(), // mongo projection
        page: z.number().optional(),
        limit: z.number().optional(),
      }),
      response: {
        "2xx": z.object({
          data: z.array(ZUserRecruteur).optional(),
          pagination: z.object({
            page: z.number().optional(),
            result_per_page: z.number(),
            number_of_page: z.number().optional(),
            total: z.number().optional(),
          }),
        }),
      },
    },
    "/api/v1/jobs/delegations/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      response: {
        "2xx": z.object({
          _id: z.string(),
          numero_voie: z.string(),
          type_voie: z.string(),
          nom_voie: z.string(),
          code_postal: z.string(),
          nom_departement: z.string(),
          entreprise_raison_sociale: z.string(),
          geo_coordonnees: z.string(),
          distance_en_km: z.number(),
        }),
      },
    },
    "/api/v1/jobs": {
      queryParams: z.object({
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
      }),
      response: {
        "2xx": z.object({
          job_count: z.number(),
          peJobs: z
            .object({
              results: z.array(ZLbaItem),
            })
            .nullable(),
          matchas: z
            .object({
              results: z.array(ZLbaItem),
            })
            .nullable(),
          lbaCompanies: z
            .object({
              results: z.array(ZLbaItem),
            })
            .nullable(),
          lbbCompanies: z.null(), // always null ???
        }),
      },
    },
    "/api/v1/jobs/company/:siret": {
      params: z.object({
        siret: extensions.siret(),
      }),
      queryParams: z.object({
        caller: z.string().optional(),
        referer: z.string().optional(), // hidden
      }),
      response: {
        "2xx": z.object({
          lbaCompanies: z.array(ZLbaItem),
        }),
      },
    },
    "/api/v1/jobs/matcha/:id": {
      params: z.object({
        id: z.string(),
      }),
      queryParams: z.object({
        caller: z.string().optional(),
      }),
      response: {
        "2xx": z.object({
          matchas: z.array(ZLbaItem),
        }),
      },
    },
    "/api/v1/jobs/job/:id": {
      params: z.object({
        id: z.string(),
      }),
      queryParams: z.object({
        caller: z.string().optional(),
      }),
      response: {
        "2xx": z.object({
          peJobs: z.array(ZLbaItem),
        }),
      },
    },
  },
  post: {
    "/api/v1/jobs/establishment": {
      body: z.object({
        establishment_siret: extensions.siret(),
        first_name: z.string(),
        last_name: z.string(),
        phone: z.string().optional(),
        email: z.string().email(),
        idcc: z.string().optional(),
        origin: z.string().optional(),
      }),
      response: {
        "2xx": ZRecruiter,
      },
    },
    "/api/v1/jobs/:establishmentId": {
      params: z.object({
        establishmentId: z.string(),
      }),
      body: z.object({
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
      }),
      response: {
        "2xx": ZRecruiter,
      },
    },
    "/api/v1/jobs/delegations/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      body: z.object({
        establishmentIds: z.array(z.string()),
      }),
      response: {
        "2xx": ZRecruiter,
      },
    },
    "/api/v1/jobs/provided/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      response: {
        "2xx": null,
      },
    },
    "/api/v1/jobs/canceled/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      response: {
        "2xx": null,
      },
    },
    "/api/v1/jobs/extend/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      response: {
        "2xx": null,
      },
    },
    "/api/v1/jobs/matcha/:id/stats/view-details": {
      params: z.object({
        id: z.string(),
      }),
      response: {
        "2xx": null,
      },
    },
  },
  patch: {
    "/api/v1/jobs/:jobId": {
      params: z.object({
        jobId: zObjectId,
      }),
      response: {
        "2xx": ZRecruiter,
      },
    },
  },
  put: {},
  delete: {},
}
