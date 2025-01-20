import { captureException } from "@sentry/node"
import { ZApiError } from "shared/models"
import { z } from "zod"

import { trackApiCall } from "./sendTrackingEvent"

export type IApiError = z.input<typeof ZApiError>

/**
 * Process une erreur lors d'un appel vers une API LBAC
 */
export const manageApiError = ({ error, api_path, caller, errorTitle }: { error: any; api_path?: string; caller?: string | null; errorTitle: string }): IApiError => {
  const errorObj: IApiError = { result: "error", error: "error", message: error.message }
  const status = error?.response?.status || error?.status || ""

  if (caller && api_path) {
    trackApiCall({ caller, api_path, response: "Error" })
  }

  if (error.response) {
    errorObj.status = error.response.status
    errorObj.statusText = error.response.statusText
    errorObj.error = error.response.statusText
  } else if (error.status) {
    errorObj.status = status
  }

  console.error(`error ${errorTitle}`, errorObj)

  return errorObj
}

export function withCause<T extends Error>(error: T, cause: Error, level: "fatal" | "error" | "warning" = "error"): T {
  error.cause = cause
  captureException(cause, { level })
  return error
}
