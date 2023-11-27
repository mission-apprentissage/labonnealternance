import { z } from "../helpers/zodWithOpenApi"

import { ZLbaCompany } from "./lbaCompany.model"

export const ZUnsubscribedLbaCompany = ZLbaCompany.extend({
  unsubscribe_date: z.coerce.date().describe("Date de désinscription"),
  unsubscribe_reason: z.string().describe("Raison de la désinscription"),
}).strict()

export type IUnsubscribedLbaCompany = z.output<typeof ZUnsubscribedLbaCompany>
