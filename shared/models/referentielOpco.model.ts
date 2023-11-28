import { OPCOS } from "../constants/recruteur"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZReferentielOpco = z
  .object({
    _id: zObjectId,
    opco_label: extensions.buildEnum(OPCOS).describe("Dénomination de l'opco"),
    siret_code: extensions.siret.describe("Siret de l'établissement"),
    emails: z.array(z.string().email()).describe("Liste des emails disponibles pour l'établissement"),
  })
  .strict()

export type IReferentielOpco = z.output<typeof ZReferentielOpco>
