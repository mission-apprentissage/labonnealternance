import { z } from "zod"

import { zObjectId } from "../models/common"
import { ZJob } from "../models/job.model"
import { ZRecruiter } from "../models/recruiter.model"

import { IRoutesDef } from "./common.routes"

export const zFormulaireRoute = {
  get: {
    "/api/formulaire": {
      querystring: z.object({ query: z.string() }), // mongo query
      response: {
        "2xx": z.array(ZRecruiter),
      },
      securityScheme: {
        auth: "jwt-bearer",
        role: "all",
      },
    },
    "/api/formulaire/:establishment_id": {
      params: z.object({ establishment_id: z.string() }),
      response: {
        "2xx": ZRecruiter,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/offre/f/:jobId": {
      params: z.object({ jobId: zObjectId }),
      response: {
        "2xx": ZJob,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  post: {
    "/api/formulaire": {
      body: z
        .object({
          userRecruteurId: zObjectId,
          establishment_siret: z.string(),
          email: z.string(),
          last_name: z.string(),
          first_name: z.string(),
          phone: z.string(),
          opco: z.string(),
          idcc: z.string(),
        })
        .strict(),
      response: {
        "2xx": ZRecruiter,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/:establishment_id/offre": {
      params: z.object({ establishment_id: z.string() }),
      body: ZJob,
      response: {
        "2xx": ZRecruiter,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/offre/:jobId/delegation": {
      params: z.object({ jobId: z.string() }),
      body: z.object({
        etablissementCatalogueIds: z.array(z.string()),
      }),
      response: {
        "2xx": ZRecruiter,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  put: {
    "/api/formulaire/:establishment_id": {
      params: z.object({ establishment_id: z.string() }),
      body: ZRecruiter.partial(),
      response: {
        "2xx": ZRecruiter,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/offre/:jobId": {
      params: z.object({ jobId: zObjectId }),
      body: ZJob.partial(),
      response: {
        "2xx": ZRecruiter,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/offre/:jobId/cancel": {
      params: z.object({ jobId: zObjectId }),
      response: {
        "2xx": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/offre/:jobId/provided": {
      params: z.object({ jobId: zObjectId }),
      response: {
        "2xx": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  patch: {
    // KBA 20230922 to be checked, description is false and it only updates delegations
    "/api/formulaire/offre/:jobId": {
      params: z.object({ jobId: zObjectId }),
      querystring: z.object({ siret_formateur: z.string() }),
      response: {
        "2xx": ZJob,
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
  delete: {
    "/api/formulaire/:establishment_id": {
      params: z.object({ establishment_id: z.string() }),
      response: {
        "2xx": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
    "/api/formulaire/delegated/:establishment_siret": {
      params: z.object({ establishment_siret: z.string() }),
      response: {
        "2xx": z.undefined(),
      },
      securityScheme: {
        auth: "none",
        role: "all",
      },
    },
  },
} as const satisfies IRoutesDef
