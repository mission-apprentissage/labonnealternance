import { capitalize } from "lodash-es"

import { z } from "../zodWithOpenApi.js"

export function setupZodErrorMap() {
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
}
