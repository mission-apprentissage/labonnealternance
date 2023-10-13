import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zTrainingLinksRoutes = {
  post: {
    "/traininglinks": {
      method: "post",
      path: "/traininglinks",
      body: z
        .array(
          z
            .object({
              id: z.string().refine((data) => data.trim().length > 0, {
                message: "l'id est obligatoire",
              }),
              cle_ministere_educatif: z.string().nullable(),
              mef: z.string().nullable(),
              cfd: z.string().nullable(),
              rncp: z.string().nullable(),
              code_postal: z.string().nullable(),
              uai: z.string().nullable(),
              uai_lieu_formation: z.string().nullable(),
              uai_formateur: z.string().nullable(),
              uai_formateur_responsable: z.string().nullable(),
              code_insee: z.string().nullable(),
            })
            .strict()
            .refine(({ rncp, cfd, mef }) => !!(rncp || cfd || mef), { message: "Au moins un des champs suivants est obligatoire : CFD, RNCP, MEF" })
            .refine(({ uai_formateur, uai_formateur_responsable, uai_lieu_formation }) => !!(uai_formateur || uai_formateur_responsable || uai_lieu_formation), {
              message: "Au moins un des champs suivants est obligatoire : uai_formateur, uai_formateur_responsable, uai_lieu_formation ",
            })
        )
        .max(100),
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
