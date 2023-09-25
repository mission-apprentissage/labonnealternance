import { z } from "zod"

import { IRoutesDef } from "./common.routes"

export const zOptoutRoutes = {
  get: {
    "/api/optout/validate": {
      // jwt auth
      response: {
        "200": z
          .object({
            etat: z.string().describe("Etat administratif de l'organisme de formation"),
            uai: z.array(z.string()).describe("UAI potentiel de l'organisme de formation"),
            rue: z.string().describe("Rue de l'organisme de formation"),
            code_postal: z.string().describe("Code postal de l'organisme de formation"),
            commune: z.string().describe("Commune de l'organisme de formation"),
            siret: z.string().describe("Numéro SIRET de l'organisme de formation"),
            contacts: z
              .array(
                z.object({
                  email: z.string().email(),
                  confirmé: z.boolean(),
                  sources: z.array(z.string()),
                })
              )
              .describe("liste des contacts"),
            qualiopi: z.boolean().describe("Certification QUALIOPI"),
            raison_sociale: z.string().nullable().describe("Raison social de l'entreprise"),
            adresse: z.string().nullable().describe("Adresse de l'entreprise"),
            geo_coordonnees: z.string().nullable().describe("Latitude/Longitude (inversion lié à LBA) de l'adresse de l'entreprise"),
            mail: z
              .array(
                z
                  .object({
                    email: z.string(),
                    messageId: z.string(),
                    date: z.date(),
                  })
                  .strict()
              )
              .describe("Interaction avec les contacts"),
            user_id: z.string().describe("Identifiant mongoDB de l'utilisateur, si il existe dans la collection User"),
            email: z.string().email(),
          })
          .strict(),
      },
    },
  },
} satisfies IRoutesDef
