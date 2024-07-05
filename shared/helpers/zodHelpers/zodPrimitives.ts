import { capitalize } from "lodash-es"

import { CODE_INSEE_REGEX, CODE_NAF_REGEX, CODE_ROME_REGEX, LATITUDE_REGEX, LONGITUDE_REGEX, RNCP_REGEX, SIRET_REGEX, UAI_REGEX } from "../../constants/regex"
import { validateSIRET } from "../../validators/siretValidator"
import { removeUrlsFromText } from "../common"
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
  phone: () =>
    z
      .string()
      .trim()
      .transform((value) => removeUrlsFromText(value)) /*.regex(phoneRegex)*/,
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
        ts: z.number(),
        date: z.string().nullish(),
        "message-id": z.string().nullish(),
        ts_event: z.number().nullish(),
        subject: z.string().nullish(),
        "X-Mailin-custom": z.string().nullish(),
        sending_ip: z.string().nullish(),
        ts_epoch: z.number().nullish(),
        template_id: z.number().nullish(),
        tag: z.string().nullish(),
        tags: z.array(z.string()).nullish(),
        link: z.string().nullish(),
        reason: z.string().nullish(),
        date_sent: z.string().nullish(),
        date_event: z.string().nullish(),
        ts_sent: z.number().nullish(),
        camp_id: z.number().nullish(),
        campaign_name: z.string().nullish(),
        URL: z.string().nullish(),
        list_id: z.array(z.number()).nullish(),
        sender_email: z.string().nullish(),
        is_returnpath: z.boolean().nullish(),
        key: z.string().nullish(),
        content: z.array(z.string()).nullish(),
      })
      .strict(),
  buildEnum: (enumObject: Record<string, string>) => {
    const values = Object.values(enumObject)
    if (!values.length) {
      throw new Error("inattendu : enum vide")
    }
    return z.enum([values[0], ...values.slice(1)])
  },
  romeCode: () => z.string().trim().regex(CODE_ROME_REGEX, "Code ROME invalide"),
  rncpCode: () => z.string().trim().regex(RNCP_REGEX, "Code RNCP invalide"),
  latitude: () => z.string().trim().regex(LATITUDE_REGEX, "Latitude invalide"),
  longitude: () => z.string().trim().regex(LONGITUDE_REGEX, "Longitude invalide"),
  inseeCode: () => z.string().trim().regex(CODE_INSEE_REGEX, "Code INSEE invalide"),
}
