import { IApplicationApiPrivateJSON, ZApplicationApiPrivate } from "shared"
import { validatePhone } from "shared/validators/phoneValidator"
import { z } from "zod"

import { sessionStorageGet } from "@/utils/localStorage"

export type IApplicationSchemaInitValues = Omit<IApplicationApiPrivateJSON, "caller">

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

export const ApplicationFormikSchema = ZApplicationApiPrivate.pick({
  applicant_attachment_name: true,
}).extend({
  applicant_first_name: z.string({ required_error: "⚠ Le prénom est obligatoire" }).trim(),
  applicant_last_name: z.string({ required_error: "⚠ Le nom est obligatoire" }).trim(),
  applicant_email: z.string({ required_error: "⚠ L'adresse email est obligatoire" }).email("⚠ Adresse e-mail invalide").trim(),
  applicant_phone: z.string().trim().refine(validatePhone, { message: "Téléphone non valide : veuillez utiliser le format international (+33XXX...) ou national (06XXX...)" }),
})
