import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZMail = z
  .object({
    _id: zObjectId,
    email: z.string(),
    messageId: z.string(),
    date: z.date(),
  })
  .strict()

export type IMail = z.output<typeof ZMail>

export const ZOptout = z
  .object({
    _id: zObjectId,
    etat: z.string().describe("Etat administratif de l'organisme de formation"),
    uai: z.array(z.string()).describe("UAI potentiel de l'organisme de formation"),
    rue: z.string().describe("Rue de l'organisme de formation"),
    code_postal: z.string().describe("Code postal de l'organisme de formation"),
    commune: z.string().describe("Commune de l'organisme de formation"),
    siret: z.string().describe("Numéro SIRET de l'organisme de formation"),
    contacts: z
      .array(
        z
          .object({
            email: z.string().email(),
            confirmé: z.boolean(),
            sources: z.array(z.string()),
          })
          .strict()
      )
      .describe("liste des contacts"),
    qualiopi: z.boolean().describe("Certification QUALIOPI"),
    raison_sociale: z.string().nullable().describe("Raison social de l'entreprise"),
    adresse: z.string().nullable().describe("Adresse de l'entreprise"),
    geo_coordonnees: z.string().nullable().describe("Latitude/Longitude (inversion lié à LBA) de l'adresse de l'entreprise"),
    mail: z.array(ZMail).describe("Interaction avec les contacts"),
    user_id: z.string().describe("Identifiant mongoDB de l'utilisateur, si il existe dans la collection User"),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()

export type IOptout = z.output<typeof ZOptout>
