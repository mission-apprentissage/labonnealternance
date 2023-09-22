import { z } from "../helpers/zodWithOpenApi"
import { zObjectId } from "../models/common"
import { ZEtablissement } from "../models/etablissement.model"

import { IRoutesDef } from "./common.routes"

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
  patch: {},
} satisfies IRoutesDef
