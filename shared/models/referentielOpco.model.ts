import { OPCOS_LABEL } from "../constants/recruteur.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "referentielopcos" as const

export const ZReferentielOpco = z
  .object({
    _id: zObjectId,
    opco_label: extensions.buildEnum(OPCOS_LABEL).describe("Dénomination de l'opco"),
    siret_code: extensions.siret.describe("Siret de l'établissement"),
    emails: z.array(z.string().email()).describe("Liste des emails disponibles pour l'établissement"),
  })
  .strict()

export const ZReferentielOpcoInsert = ZReferentielOpco.pick({
  opco_label: true,
  siret_code: true,
  emails: true,
})

export type IReferentielOpco = z.output<typeof ZReferentielOpco>

export default {
  zod: ZReferentielOpco,
  indexes: [[{ siret_code: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
