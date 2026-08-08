import { OPCOS_LABEL } from "../constants/recruteur.js"
import { z } from "../helpers/zod-with-open-api.js"
import { extensions } from "../helpers/zodHelpers/zod-primitives.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "opcos" as const

export const zOpcoLabel = extensions.buildEnum(OPCOS_LABEL).describe("Opco de rattachement de l'établissement")

export const ZOpco = z.strictObject({
  _id: zObjectId,
  siren: z.string().describe("SIREN de l'établissement"),
  opco: z.string().describe("Opco de rattachement de l'établissement"),
  idcc: z.number().nullable().describe("Identifiant convention collective"),
  url: z.string().nullish().describe("Site internet de l'opco"),
})

export type IOpco = z.output<typeof ZOpco>

export default {
  zod: ZOpco,
  indexes: [[{ siren: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor
