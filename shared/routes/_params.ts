import { z } from "../helpers/zodWithOpenApi"

export const zDiplomaParam = z
  .union([z.string().startsWith("3"), z.string().startsWith("4"), z.string().startsWith("5"), z.string().startsWith("6"), z.string().startsWith("7")])
  .openapi({
    param: {
      description: "Le niveau de diplôme requis. Si précisé, doit contenir à minima le chiffre d'une seule des valeurs autorisées",
    },
    type: "string",
    example: "3",
  })

export const zCallerParam = z.string().openapi({
  param: {
    description: "Votre raison sociale ou le nom de votre produit qui fait appel à l'API idéalement préfixé par une adresse email de contact",
  },
  example: "contact@domaine nom_de_societe",
})

export const zGetFormationOptions = z
  .literal("with_description")
  .openapi({
    param: {
      description: "Ajoute la description au résultat de retour",
    },
    example: "with_description",
  })
  .optional()

export const zRefererHeaders = z
  .object({
    referer: z.string().optional(),
  })
  .passthrough()
