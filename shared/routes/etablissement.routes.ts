import { z } from "zod"

import { zObjectId } from "../models/common"
import { ZEtablissement } from "../models/etablissement.model"

export const zEtablissementRoutes = {
  get: {
    "/api/etablissements/:id": {
      params: z.object({ id: zObjectId }).strict(),
      response: {
        "2xx": ZEtablissement,
      },
    },
  },
  post: {},
  put: {},
  delete: {},
}
