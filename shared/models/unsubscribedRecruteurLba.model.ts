import { UNSUBSCRIBE_EMAIL_ERRORS } from "../constants/recruteur.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor } from "./common.js"
import { ZLbaCompany } from "./recruteurLba.model.js"

const collectionName = "unsubscribedrecruteurslba" as const

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

export const ZUnsubscribeQueryParams = z.object({ email: z.string().email(), reason: z.string(), sirets: z.array(extensions.siret).nullish() }).strict()

export const ZUnsubscribeCompanyData = z.object({ enseigne: z.string(), siret: extensions.siret, address: z.string() }).strict()

export const ZUnsubscribeQueryResponse = z
  .object({ result: z.enum(["OK", ...Object.values(UNSUBSCRIBE_EMAIL_ERRORS)]), companies: z.array(ZUnsubscribeCompanyData).nullish() })
  .strict()

export type IUnsubscribeQueryResponse = z.output<typeof ZUnsubscribeQueryResponse>
export type IUnsubscribeCompanyData = z.output<typeof ZUnsubscribeCompanyData>

export default {
  zod: ZUnsubscribedLbaCompany,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
