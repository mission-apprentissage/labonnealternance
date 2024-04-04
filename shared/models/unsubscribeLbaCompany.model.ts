import { UNSUBSCRIBE_EMAIL_ERRORS } from "../constants/recruteur"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

export const ZUnsubscribeQueryParams = z.object({ email: z.string().email(), reason: z.string(), sirets: z.array(extensions.siret).nullish() }).strict()

export const ZUnsubscribeCompanyData = z.object({ enseigne: z.string(), siret: extensions.siret, address: z.string() }).strict()

export const ZUnsubscribeQueryResponse = z
  .object({ result: z.enum(["OK", ...Object.values(UNSUBSCRIBE_EMAIL_ERRORS)]), companies: z.array(ZUnsubscribeCompanyData).nullish() })
  .strict()

export type IUnsubscribeQueryResponse = z.output<typeof ZUnsubscribeQueryResponse>
export type IUnsubscribeCompanyData = z.output<typeof ZUnsubscribeCompanyData>
