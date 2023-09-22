import { z } from "zod"

import { zObjectId } from "../models/common"
import { ZJob } from "../models/job.model"
import { ZRecruiter } from "../models/recruiter.model"

export const zFormulaireRoute = {
  get: {
    "/api/formulaire/": {
      queryString: z.object({ query: z.string() }), // mongo query
      response: {
        "2xx": z.array(ZRecruiter),
      },
    },
    "/api/formulaire/:establishment_id": {
      params: z.object({ establishment_id: z.string() }),
      response: {
        "2xx": ZRecruiter,
      },
    },
    "/api/formulaire/offre/f/:jobId": {
      params: z.object({ jobId: zObjectId }),
      response: {
        "2xx": ZJob,
      },
    },
  },
  post: {
    "/api/formulaire/": {
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
    },
    "/api/formulaire/:establishment_id/offre": {
      params: z.object({ establishment_id: z.string() }),
      body: ZJob,
      response: {
        "2xx": ZRecruiter,
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
    },
  },
  put: {
    "/api/formulaire/:establishment_id": {
      body: ZRecruiter.partial(),
      params: z.object({ establishment_id: z.string() }),
      response: {
        "2xx": ZRecruiter,
      },
    },
    "/api/formulaire/offre/:jobId": {
      body: ZJob.partial(),
      params: z.object({ jobId: zObjectId }),
      response: {
        "2xx": ZJob,
      },
    },
    "/api/formulaire/offre/:jobId/cancel": {
      params: z.object({ jobId: zObjectId }),
      response: {
        "2xx": null,
      },
    },
    "/api/formulaire/offre/:jobId/provided": {
      params: z.object({ jobId: zObjectId }),
      response: {
        "2xx": null,
      },
    },
  },
  patch: {
    // KBA 20230922 to be checked, description is false and it only updates delegations
    "/api/formulaire/offre/:jobId": {
      params: z.object({ jobId: zObjectId }),
      queryString: z.object({ siret_formateur: z.string() }),
      response: {
        "2xx": ZJob,
      },
    },
  },
  delete: {
    "/api/formulaire/:establishment_id": {
      params: z.object({ establishment_id: z.string() }),
      response: {
        "2xx": null,
      },
    },
    "/api/formulaire/delegated/:establishment_siret": {
      params: z.object({ establishment_siret: z.string() }),
      response: {
        "2xx": null,
      },
    },
  },
}
