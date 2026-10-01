import { OPCOS_LABEL } from "shared/constants/index"
import { describe, expect, it } from "vitest"
import { EMAIL_FORMAT_ERROR, PHONE_FORMAT_ERROR } from "@/utils/validation-messages"
import { buildAdminUserFormSchema, toSubmittedPhone } from "./admin-user-form.schema"

const getErrors = (isCreation: boolean, values: Record<string, unknown>) => {
  const result = buildAdminUserFormSchema(isCreation).safeParse(values)
  return result.success ? {} : Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]))
}

const validUser = { first_name: "Camille", last_name: "Martin", email: "camille.martin@domaine.fr", type: "ADMIN" }

describe("buildAdminUserFormSchema", () => {
  // Formik convertit les champs vides en undefined avant la validation
  it("signale tous les champs manquants au premier envoi d'un formulaire de création vide, OPCO compris", () => {
    expect(getErrors(true, { type: "OPCO" })).toEqual({
      first_name: "Saisissez le prénom",
      last_name: "Saisissez le nom",
      email: EMAIL_FORMAT_ERROR,
      opco: "Sélectionnez un OPCO",
    })
  })

  it("exige un OPCO en création d'un compte OPCO", () => {
    expect(getErrors(true, { ...validUser, type: "OPCO" })).toEqual({ opco: "Sélectionnez un OPCO" })
    expect(getErrors(true, { ...validUser, type: "OPCO", opco: OPCOS_LABEL.AKTO })).toEqual({})
  })

  it("n'exige pas d'OPCO pour un compte ADMIN ni en édition", () => {
    expect(getErrors(true, validUser)).toEqual({})
    expect(getErrors(false, { ...validUser, type: "OPCO" })).toEqual({})
  })

  it("refuse un prénom ou un nom composé d'espaces", () => {
    expect(getErrors(false, { ...validUser, first_name: "  ", last_name: " " })).toEqual({ first_name: "Saisissez le prénom", last_name: "Saisissez le nom" })
  })

  it("refuse un e-mail mal formé avec le message d'exemple", () => {
    expect(getErrors(false, { ...validUser, email: "camille.martin" })).toEqual({ email: EMAIL_FORMAT_ERROR })
  })

  it("accepte un téléphone absent ou français quel que soit son format d'écriture", () => {
    for (const phone of [undefined, "0612345678", "06 12 34 56 78", "+33612345678", "+262 692 12 34 56"]) {
      expect(getErrors(false, { ...validUser, phone })).toEqual({})
    }
  })

  it("refuse un téléphone invalide ou hors plan de numérotation français", () => {
    for (const phone of ["061234567", "0813458765", "+32470123456"]) {
      expect(getErrors(false, { ...validUser, phone })).toEqual({ phone: PHONE_FORMAT_ERROR })
    }
  })
})

describe("toSubmittedPhone", () => {
  it("envoie le téléphone au format national à 10 chiffres", () => {
    expect(toSubmittedPhone("06 12 34 56 78")).toBe("0612345678")
    expect(toSubmittedPhone("+33612345678")).toBe("0612345678")
    expect(toSubmittedPhone("+262 692 12 34 56")).toBe("0692123456")
  })

  it("envoie une chaîne vide pour un téléphone absent", () => {
    expect(toSubmittedPhone(undefined)).toBe("")
    expect(toSubmittedPhone("")).toBe("")
  })
})
