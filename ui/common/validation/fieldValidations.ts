import { PERSON_NAME_VALIDATION_MESSAGE, validatePersonName } from "shared/validators/nameValidator"
import { validateSIRET } from "shared/validators/siretValidator"
import * as Yup from "yup"

export const phoneValidation = () => {
  return Yup.string()
    .matches(/^[0-9]+$/, "Le téléphone est composé uniquement de chiffres")
    .min(10, "le téléphone est sur 10 chiffres")
    .max(10, "le téléphone est sur 10 chiffres")
}

export const personNameValidation = () => {
  return Yup.string()
    .trim()
    .test("valid-person-name", PERSON_NAME_VALIDATION_MESSAGE, (value) => !value || validatePersonName(value))
}

export const SIRETValidation = () => {
  return Yup.string()
    .transform((value) => value.split(" ").join(""))
    .matches(/^[0-9]+$/, "Le siret est composé uniquement de chiffres")
    .min(14, "le siret est sur 14 chiffres")
    .max(14, "le siret est sur 14 chiffres")
    .test("test-luhn", "Le numéro de SIRET saisi n’est pas valide", (value) => validateSIRET(value))
}
