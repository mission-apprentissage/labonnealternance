import { capitalize } from "lodash-es"

import { CODE_NAF_REGEX, SIRET_REGEX, UAI_REGEX } from "../../constants/regex"
import { validateSIRET } from "../../validators/siretValidator"
import { z } from "../zodWithOpenApi"

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

//const phoneRegex = new RegExp(/^0[1-9]\d{8}$/)

export const extensions = {
  siret: z
    .string()
    .trim()
    .regex(SIRET_REGEX, "SIRET invalide")
    .refine(validateSIRET, {
      message: "Le siret ne respecte pas l'algorithme luhn (https://fr.wikipedia.org/wiki/Formule_de_Luhn)",
    })
    .openapi({
      description: "Le numéro de SIRET de l'établissement",
      param: {
        description: "Le numéro de SIRET de l'établissement",
      },
      example: "78424186100011",
    }),
  uai: () => z.string().trim().regex(UAI_REGEX, "UAI invalide"), // e.g 0123456B
  phone: () => z.string().trim() /*.regex(phoneRegex)*/,
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
  brevoWebhook: () =>
    z
      .object({
        event: z.string(),
        email: z.string(),
        id: z.number(),
        date: z.string(),
        ts: z.number(),
        "message-id": z.string(),
        ts_event: z.number(),
        subject: z.string(),
        tag: z.string().nullish(),
        sending_ip: z.string(),
        ts_epoch: z.number(),
        tags: z.array(z.string()).nullish(),
      })
      .strict(),
  buildEnum: (enumObject: Record<string, string>) => {
    const values = Object.values(enumObject)
    if (!values.length) {
      throw new Error("inattendu : enum vide")
    }
    return z.enum([values[0], ...values.slice(1)])
  },
}
