import { LBA_ITEM_TYPE_OLD } from "../constants/lbaitem.js"
import { NIVEAUX_POUR_LBA } from "../constants/recruteur.js"
import { z } from "../helpers/zodWithOpenApi.js"

export const zCallerParam = z
  .string()
  .openapi({
    // Duplicated description because we have description when used in queryparams vs body
    param: {
      description: "Votre raison sociale ou le nom de votre produit qui fait appel à l'API idéalement préfixé par une adresse email de contact",
    },
    description: "Votre raison sociale ou le nom de votre produit qui fait appel à l'API idéalement préfixé par une adresse email de contact",
    example: "contact@domaine nom_de_societe",
  })
  .optional()

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
      description: "La latitude du centre de recherche. Nécessaire avec insee et longitude pour une recherche localisée.",
    },
    example: 48.845,
  })

export const ZLongitudeParam = z.coerce
  .number()
  .optional()
  .openapi({
    param: {
      description: "La longitude du centre de recherche. Nécessaire avec latitude et insee pour une recherche localisée.",
    },
    example: 2.3752,
  })

export const ZRadiusParam = z.coerce
  .number()
  .optional()
  .openapi({
    param: {
      description: "Le rayon de recherche en kilomètres",
    },
    example: 30,
  })

export const zInseeParams = z
  .string()
  .optional()
  .openapi({
    param: {
      description: "search center insee code",
    },
  })

// const allLbaItemTypes = Object.values(LBA_ITEM_TYPE)
const allLbaItemTypesOLD = Object.values(LBA_ITEM_TYPE_OLD)

const sourceENUM = z.enum([allLbaItemTypesOLD[0], ...allLbaItemTypesOLD.slice(1)])
const SourceArraySchema = z.array(sourceENUM)

export const zSourcesParams = z
  .string()
  .refine(
    (value) => {
      const sources = value.split(",")
      return SourceArraySchema.safeParse(sources).success
    },
    {
      message: `Invalid source format. Must be a comma-separated list of valid sources of ${allLbaItemTypesOLD.join(",")}`,
    }
  )
  .optional()
  .openapi({
    param: {
      description: `comma separated list of job opportunities sources and trainings (possible values : ${allLbaItemTypesOLD.join(", ")})`,
    },
  })

const diplomaLevels = Object.keys(NIVEAUX_POUR_LBA)

export const zDiplomaParam = z
  .enum([diplomaLevels[0], ...diplomaLevels.slice(1)])
  .optional()
  .openapi({
    param: {
      description: "Le niveau de diplôme visé en fin d'études",
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
