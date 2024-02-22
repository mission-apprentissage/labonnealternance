import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZUnsubscribeOF = z
  .object({
    _id: zObjectId,
    catalogue_id: z.string().describe("Id de l'organisme dans le catalogue"),
    establishment_siret: extensions.siret.describe("Le Siret de l'organisme de formation"),
    unsubscribe_date: z.coerce.date().describe("Date de désinscription"),
  })
  .strict()

export type IUnsubscribedOF = z.output<typeof ZUnsubscribeOF>
