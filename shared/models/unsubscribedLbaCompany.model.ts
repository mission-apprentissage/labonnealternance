import { z } from "../helpers/zodWithOpenApi"

import { ZLbaCompany } from "./lbaCompany.model"

export const ZUnsubscribedLbaCompany = ZLbaCompany.pick({
  _id: true,
  siret: true,
  raison_sociale: true,
  enseigne: true,
  naf_code: true,
  naf_label: true,
  rome_codes: true,
  insee_city_code: true,
  zip_code: true,
  city: true,
  company_size: true,
  created_at: true,
  last_update_at: true,
})
  .extend({
    unsubscribe_date: z.coerce.date().describe("Date de désinscription"),
    unsubscribe_reason: z.string().describe("Raison de la désinscription"),
  })
  .strict()

export type IUnsubscribedLbaCompany = z.output<typeof ZUnsubscribedLbaCompany>
