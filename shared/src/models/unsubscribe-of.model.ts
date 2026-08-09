import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "unsubscribedofs" as const

export const ZUnsubscribeOF = z.strictObject({
  _id: zObjectId,
  catalogue_id: z.string().describe("Id de l'organisme dans le catalogue"),
  establishment_siret: extensions.siret.describe("Le Siret de l'organisme de formation"),
  unsubscribe_date: z.coerce.date<Date>().describe("Date de désinscription"),
})

export type IUnsubscribedOF = z.output<typeof ZUnsubscribeOF>

export default {
  zod: ZUnsubscribeOF,
  indexes: [
    [{ catalogue_id: 1 }, {}],
    [{ establishment_siret: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor
