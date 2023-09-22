import { z } from "zod"

import { zObjectId } from "../models/common"
import { ZJob } from "../models/job.model"
import { ZRecruiter } from "../models/recruiter.model"

export const zFormulaireRoute = {
  get: {
    "/": {},
    "/:establishment_id": {},
    "/offre/f/:jobId": {},
  },
  post: {
    "/": {
      body: z.object({}), // wip
    },
    "/:establishment_id/offre": {
      params: z.object({ establishment_id: z.string() }),
      body: ZJob,
      response: {
        "2xx": ZRecruiter,
      },
    },
    "/offre/:jobId/delegation": {
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
    "/:establishment_id": {
      params: z.object({ establishment_id: z.string() }),
      response: {
        "2xx": ZRecruiter,
      },
    },
    "/offre/:jobId": {
      params: z.object({ jobId: zObjectId }),
      response: {
        "2xx": ZJob,
      },
    },
    "/offre/:jobId/cancel": {
      params: z.object({ jobId: zObjectId }),
      response: {
        "2xx": null,
      },
    },
    "/offre/:jobId/provided": {
      params: z.object({ jobId: zObjectId }),
      response: {
        "2xx": null,
      },
    },
  },
  patch: {
    // KBA 20230922 to be checked, description is false and it only updates delegations
    "/offre/:jobId": {
      params: z.object({ jobId: zObjectId }),
      queryString: z.object({ siret_formateur: z.string() }),
      response: {
        "2xx": ZJob,
      },
    },
  },
  delete: {
    "/:establishment_id": {
      params: z.object({ establishment_id: z.string() }),
      response: {
        "2xx": null,
      },
    },
    "/delegated/:establishment_siret": {
      params: z.object({ establishment_siret: z.string() }),
      response: {
        "2xx": null,
      },
    },
  },
}
