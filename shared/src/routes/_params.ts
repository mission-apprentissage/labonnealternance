import { NIVEAUX_POUR_LBA, TYPE_EMPLOI_OPTIONS } from "shared/constants/recruteur"
import { LBA_ITEM_TYPE_OLD } from "../constants/lbaitem.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { typedKeys } from "../utils/objectUtils.js"

export const zCallerParam = z
  .string()

  .optional()

export const zGetFormationOptions = z
  .literal("with_description")

  .optional()

export const zRefererHeaders = z
  .object({
    referer: z.string().optional(),
  })
  .passthrough()

export const zRomesParams = (imcompatibleWith: "romeDomain" | "rncp") => z.string().optional()

export const zRncpsParams = z.string().optional()

export const ZLatitudeParam = z.coerce.number().optional()

export const ZLongitudeParam = z.coerce.number().optional()

export const ZRadiusParam = z.coerce.number().optional()

export const zInseeParams = z.string().optional()

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

const diplomaLevels = typedKeys(NIVEAUX_POUR_LBA)

export const zDiplomaParam = z.enum([diplomaLevels[0], ...diplomaLevels.slice(1)]).optional()

export type IDiplomaParam = z.output<typeof zDiplomaParam>

export const zTypesEmploiParam = z.array(extensions.buildEnum(TYPE_EMPLOI_OPTIONS)).optional()

export type ITypesEmploiParam = z.output<typeof zTypesEmploiParam>

export const zOpcoParams = z.string().optional()

export const zOpcoUrlParams = z.string().optional()
