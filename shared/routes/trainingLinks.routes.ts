import { z } from "zod"

import { IRoutesDef } from "./common.routes"

export const zTrainingLinksRoutes = {
  post: {
    "/api/trainingLinks": {
      body: z
        .array(
          z
            .object({
              id: z.string(),
              cle_ministere_educatif: z.string().optional(),
              mef: z.string().optional(),
              cfd: z.string().optional(),
              rncp: z.string().optional(),
              code_postal: z.string().optional(),
              uai: z.string().optional(),
              uai_lieu_formation: z.string().optional(),
              uai_formateur: z.string().optional(),
              uai_formateur_responsable: z.string().optional(),
              code_insee: z.string().optional(),
            })
            .strict()
        )
        .max(100),
      response: {
        "200": z.array(
          z
            .object({
              id: z.string(),
              error: z.boolean(),
              message: z.string(),
              lien_prdv: z.string(),
              lien_lba: z.string(),
            })
            .strict()
        ),
      },
    },
  },
} as const satisfies IRoutesDef
