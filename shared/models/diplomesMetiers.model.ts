import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

export const ZRomeWithLabel = z
  .object({
    codeRome: z.string(),
    intitule: z.string(),
  })
  .strict()
  .openapi("RomeWithLabel")

export type IRomeWithLabel = z.output<typeof ZRomeWithLabel>

export const ZMetierEnrichi = z
  .object({
    label: z.string().openapi({
      example: "Décor et accessoires pour le spectacle",
      description: "Le nom du métier",
    }),
    romes: z
      .string()
      .array()
      .openapi({
        example: ["L1503", "L1502", "L1506"],
        description: "La liste des codes ROMEs correspondants au métier",
      }),
    rncps: z
      .string()
      .array()
      .nullish()
      .optional()
      .openapi({
        example: ["RNCP500", "RNCP806"],
        description: "La liste des codes RNCPs correspondants au métier",
      }),
    type: z.string().nullish().optional().openapi({
      example: "job",
      description: "Indique que l'objet est de type job",
    }),
    romeTitles: ZRomeWithLabel.array().nullish().optional().openapi({
      description: "Optionnel : tableau de couples romes / libellés",
    }),
  })
  .strict()
  .openapi("MetierEnrichi")

export type IMetierEnrichi = z.output<typeof ZMetierEnrichi>

export const ZMetierEnrichiArray = ZMetierEnrichi.array().openapi({
  description: "Un tableau de métiers correspondantes aux critères",
})

export const ZMetiers = z
  .object({
    metiers: z
      .string()
      .openapi({
        example: "Accueil touristique",
        description: "Un nom de métier du référentiel La bonne alternance",
      })
      .array()
      .openapi({
        description: "Un tableau des noms des métiers triés par ordre alphabétique",
      }),
  })
  .strict()

export type IMetiers = z.output<typeof ZMetiers>

export const ZMetiersEnrichis = z
  .object({
    labelsAndRomes: ZMetierEnrichiArray.optional(),
    labelsAndRomesForDiplomas: ZMetierEnrichiArray.optional(),
  })
  .strict()

export type IMetiersEnrichis = z.output<typeof ZMetiersEnrichis>

export const ZAppellationRome = z
  .object({
    codeRome: z.string(),
    intitule: z.string(),
    appellation: z.string(),
  })
  .strict()

export const ZAppellationsRomes = z
  .object({
    coupleAppellationRomeMetier: ZAppellationRome.array(),
  })
  .strict()

export type IAppellationsRomes = z.output<typeof ZAppellationsRomes>

const collectionName = "diplomesmetiers" as const

export const ZDiplomesMetiers = z
  .object({
    _id: zObjectId,
    intitule_long: z.string(),
    codes_romes: z.array(z.string()),
    codes_rncps: z.array(z.string()),
    acronymes_intitule: z.string(),
    created_at: z.date(),
    last_update_at: z.date(),
  })
  .strict()

export type IDiplomesMetiers = z.output<typeof ZDiplomesMetiers>

export default {
  zod: ZDiplomesMetiers,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
