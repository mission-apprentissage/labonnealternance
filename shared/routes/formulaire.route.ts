import { z } from "zod"

import { zObjectId } from "../models/common"
import { ZJob } from "../models/job.model"

export const zFormulaireRoute = {
  get: {
    "/": {},
    "/:establishment_id": {},
    "/offre/f/:jobId": {},
  },
  post: {
    "/": {},
    "/:establishment_id/offre": {},
    "/offre/:jobId/delegation": {},
  },
  put: {
    "/:establishment_id": {},
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
    "/offre/:jobId": {},
  },
  delete: {
    "/:establishment_id": {},
    "/delegated/:establishment_siret": {},
  },
}
