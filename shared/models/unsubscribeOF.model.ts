import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "unsubscribedofs" as const

export const ZUnsubscribeOF = z
  .object({
    _id: zObjectId,
    catalogue_id: z.string().describe("Id de l'organisme dans le catalogue"),
    establishment_siret: extensions.siret.describe("Le Siret de l'organisme de formation"),
    unsubscribe_date: z.coerce.date().describe("Date de désinscription"),
  })
  .strict()

export type IUnsubscribedOF = z.output<typeof ZUnsubscribeOF>

export default {
  zod: ZUnsubscribeOF,
  indexes: [
    [{ catalogue_id: 1 }, {}],
    [{ establishment_siret: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
