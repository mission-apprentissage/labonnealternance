import { capitalize } from "lodash-es"

import { z } from "../zod-with-open-api.js"

export function setupZodErrorMap() {
  // custom error map to translate zod errors to french
  z.config({
    customError: (iss) => {
      if (iss.code === "invalid_type") {
        return `${capitalize(iss.expected)} attendu`
      } else if (iss.code === "custom") {
        return `${capitalize((iss.path ?? []).join("."))}: ${iss.message}`
      }
      // returning undefined defers to the next error map in the precedence chain
      // (ultimately Zod's own default message), matching the old `ctx.defaultError` fallback.
      return undefined
    },
  })
}
