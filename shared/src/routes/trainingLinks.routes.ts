import { z } from "../helpers/zodWithOpenApi.js"

import { IRoutesDef } from "./common.routes.js"

export const zTrainingLinksRoutes = {
  post: {
    "/traininglinks": {
      method: "post",
      path: "/traininglinks",
      body: z.array(
        z
          .object({
            id: z.string().refine((data) => data.trim().length > 0, {
              message: "l'id est obligatoire",
            }),
            cle_ministere_educatif: z.string().nullable().optional(),
            mef: z.string().nullable().optional(),
            cfd: z.string().nullable().optional(),
            rncp: z.string().nullable().optional(),
            code_postal: z.string().nullable().optional(),
            uai_lieu_formation: z.string().nullable().optional(),
            uai_formateur: z.string().nullable().optional(),
            uai_formateur_responsable: z.string().nullable().optional(),
            code_insee: z.string().nullable().optional(),
            siret_lieu_formation: z.string().nullable().optional(),
            siret_formateur: z.string().nullable().optional(),
            siret_formateur_responsable: z.string().nullable().optional(),
          })
          .strict()
      ),
      response: {
        "200": z.array(
          z
            .object({
              id: z.string(),
              lien_prdv: z.string(),
              lien_lba: z.string(),
            })
            .strict()
        ),
      },
      securityScheme: null,
    },
  },
} as const satisfies IRoutesDef
