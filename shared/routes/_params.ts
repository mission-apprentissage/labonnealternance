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
  // Duplicated description because we have description when used in queryparams vs body
  param: {
    description: "Votre raison sociale ou le nom de votre produit qui fait appel à l'API idéalement préfixé par une adresse email de contact",
  },
  description: "Votre raison sociale ou le nom de votre produit qui fait appel à l'API idéalement préfixé par une adresse email de contact",
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

export const zRomesParams = (imcompatibleWith: "romeDomain" | "rncp") =>
  z
    .string()
    .optional()
    .openapi({
      param: {
        description: `Une liste de codes ROME séparés par des virgules correspondant au(x) métier(s) recherché(s). Maximum 20.<br />rome et ${imcompatibleWith} sont incompatibles.<br/><strong>Au moins un des deux doit être renseigné.</strong>`,
      },
      example: "F1603,I1308",
    })

export const zRncpsParams = z
  .string()
  .optional()
  .openapi({
    param: {
      description: "Un code RNCP. <br />rome et rncp sont incompatibles.<br /><strong>Au moins un des deux doit être renseigné.</strong>",
    },
  })

export const ZLatitudeParam = z.coerce
  .number()
  .optional()
  .openapi({
    param: {
      description: "search center latitude. Without latitude, the search will target whole France",
    },
  })

export const ZLongitudeParam = z.coerce
  .number()
  .optional()
  .openapi({
    param: {
      description: "search center longitude. Without longitude, the search will target whole France",
    },
  })

export const ZRadiusParam = z.coerce
  .number()
  .optional()
  .openapi({
    param: {
      description: "the search radius",
    },
  })

export const zInseeParams = z
  .string()
  .optional()
  .openapi({
    param: {
      description: "search center insee code",
    },
  })

export const zSourcesParams = z
  .string()
  .optional()
  .openapi({
    param: {
      description: 'comma separated list of job opportunities sources and trainings (possible values : "formations", "lba", "matcha", "offres")',
    },
  })

export const zDiplomaParams = z
  .string()
  .optional()
  .openapi({
    param: {
      description: "targeted diploma",
    },
  })

export const zOpcoParams = z
  .string()
  .optional()
  .openapi({
    param: {
      description: "filter opportunities on opco name",
    },
  })

export const zOpcoUrlParams = z
  .string()
  .optional()
  .openapi({
    param: {
      description: "filter opportunities on opco url",
    },
  })
