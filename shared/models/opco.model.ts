import { OPCOS_LABEL } from "../constants"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { zObjectId, IModelDescriptor } from "./common"

const collectionName = "opcos" as const

export const zOpcoLabel = extensions.buildEnum(OPCOS_LABEL).describe("Opco de rattachement de l'établissement")

export const ZOpco = z
  .object({
    _id: zObjectId,
    siren: z.string().describe("SIREN de l'établissement"),
    opco: z.string().describe("Opco de rattachement de l'établissement"),
    opco_short_name: z.string().nullish().describe("Nom court de de l'opco servant de clef dans notre table de constantes"),
    idcc: z.string().nullish().describe("Identifiant convention collective"),
    url: z.string().nullish().describe("Site internet de l'opco"),
  })
  .strict()

export type IOpco = z.output<typeof ZOpco>

export default {
  zod: ZOpco,
  indexes: [
    [{ siren: 1 }, { unique: true }],
    [{ opco: 1 }, {}],
    [{ opco_short_name: 1 }, {}],
    [{ idcc: 1 }, {}],
    [{ url: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
