import * as Yup from "yup"

import { sessionStorageGet } from "@/utils/localStorage"

import { phoneValidation } from "../../../../common/validation/fieldValidations"

export function getInitialSchemaValues() {
  const inSessionValue = JSON.parse(sessionStorageGet("application-form-values"))
  return {
    firstName: inSessionValue?.applicant_first_name ?? "",
    lastName: inSessionValue?.applicant_last_name ?? "",
    email: inSessionValue?.applicant_email ?? "",
    phone: inSessionValue?.applicant_phone ?? "",
    fileName: inSessionValue?.applicant_file_name ?? "",
    fileContent: inSessionValue?.applicant_file_content ?? "",
    message: inSessionValue?.message ?? "",
  }
}

export function getValidationSchema() {
  return Yup.object({
    fileName: Yup.string().nullable().required("⚠ La pièce jointe est obligatoire"),
    firstName: Yup.string().max(50, "⚠ Doit avoir 50 caractères ou moins").required("⚠ Le prénom est obligatoire"),
    lastName: Yup.string().max(50, "⚠ Doit avoir 50 caractères ou moins").required("⚠ Le nom est obligatoire"),
    email: Yup.string().email("⚠ Adresse e-mail invalide").required("⚠ L'adresse e-mail est obligatoire"),
    phone: phoneValidation().required("⚠ Le numéro de téléphone est obligatoire"),
  })
}
