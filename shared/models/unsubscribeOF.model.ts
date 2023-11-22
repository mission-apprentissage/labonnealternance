import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

export const ZUnsubscribeOF = z
  .object({
    catalogue_id: z.string().describe("Id de l'organisme dans le catalogue"),
    establishment_siret: extensions.siret.describe("Le Siret de l'organisme de formation"),
    unsubscribe_date: z.coerce.date().describe("Date de désinscription"),
  })
  .strict()

export type IUnsubscribedOF = z.output<typeof ZUnsubscribeOF>
