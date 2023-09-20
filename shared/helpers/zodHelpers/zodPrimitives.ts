import { capitalize } from "lodash-es"
import luhn from "luhn"
import { z } from "zod"

import { CODE_NAF_REGEX, SIRET_REGEX, UAI_REGEX } from "../../constants/regex"

// custom error map to translate zod errors to french
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    return { message: `${capitalize(issue.expected)} attendu` }
  } else if (issue.code === z.ZodIssueCode.custom) {
    return { message: `${capitalize(issue.path.join("."))}: ${issue.message}` }
  }

  return { message: ctx.defaultError }
}
z.setErrorMap(customErrorMap)

export const extensions = {
  siret: () =>
    z
      .string()
      .trim()
      .regex(SIRET_REGEX, "SIRET invalide")
      .refine((val) => luhn.validate(val), {
        message: "Le siret ne respecte pas l'algorithme luhn",
      }), // e.g 01234567890123
  uai: () => z.string().trim().regex(UAI_REGEX, "UAI invalide"), // e.g 0123456B
  code_naf: () =>
    z.preprocess(
      (v: unknown) => (typeof v === "string" ? v.replace(".", "") : v), // parfois, le code naf contient un point
      z.string().trim().toUpperCase().regex(CODE_NAF_REGEX, "NAF invalide") // e.g 1071D
    ),
  iso8601Date: () =>
    z.preprocess(
      (v: unknown) => (typeof v === "string" && v.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/) ? new Date(v.trim()) : v),
      z.date({
        invalid_type_error: "Date invalide",
        required_error: "Champ obligatoire",
      })
    ),
  iso8601Datetime: () =>
    z.preprocess(
      (v: unknown) => (typeof v === "string" && v.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})/) ? new Date(v.trim()) : v),
      z.date({
        invalid_type_error: "Date invalide",
        required_error: "Champ obligatoire",
      })
    ),
  codeCommuneInsee: () => z.string().regex(/^([0-9]{2}|2A|2B)[0-9]{3}$/, "Format invalide"),
}
