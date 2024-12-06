import { IApplicationApiPayloadJSON, ZApplicationApiPayload } from "shared"
import { z } from "zod"

import { sessionStorageGet } from "@/utils/localStorage"

export type IApplicationSchemaInitValues = Omit<IApplicationApiPayloadJSON, "caller">

export function getInitialSchemaValues(): IApplicationSchemaInitValues {
  const inSessionValue = JSON.parse(sessionStorageGet("application-form-values"))
  return {
    applicant_first_name: inSessionValue?.applicant_first_name ?? "",
    applicant_last_name: inSessionValue?.applicant_last_name ?? "",
    applicant_email: inSessionValue?.applicant_email ?? "",
    applicant_phone: inSessionValue?.applicant_phone ?? "",
    applicant_attachment_name: inSessionValue?.applicant_attachment_name ?? "",
    applicant_attachment_content: inSessionValue?.applicant_attachment_content ?? "",
    applicant_message: inSessionValue?.message ?? "",
  }
}

export const ApplicationFormikSchema = ZApplicationApiPayload.pick({
  applicant_first_name: true,
  applicant_last_name: true,
  applicant_email: true,
  applicant_attachment_name: true,
}).extend({
  applicant_phone: z
    .string({ required_error: "⚠ Le numéro de téléphone est obligatoire" })
    .min(10, "le téléphone est sur 10 chiffres")
    .max(10, "le téléphone est sur 10 chiffres"), // KBA 2024-12-04: based application schema needs to be changed
})
