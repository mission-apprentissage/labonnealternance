import Sentry from "@sentry/node"
import { trackApiCall } from "./sendTrackingEvent.js"
import { sentryCaptureException } from "./sentryUtils.js"

export interface IApiError {
  result?: string
  error?: string
  message?: any
  status?: number
  statusText?: string
}

/**
 * Process une erreur lors d'un appel vers une API LBAC
 * @param {any} error l'erreur JS levée
 * @param {string} api_path Le nom de l'API LBAC appelée
 * @param {string} caller L'identification fournie par l'utilisateur de l'api
 * @param {string} errorTitle Le titre de l'erreur
 * @returns {IApiError}
 */
export const manageApiError = ({ error, api_path, caller, errorTitle }: { error: any; api_path?: string; caller?: string; errorTitle: string }): IApiError => {
  const errorObj: IApiError = { result: "error", error: "error", message: error.message }
  const status = error?.response?.status || ""
  error.name = `API error ${status ? status + " " : ""}${errorTitle}`
  if (error?.config) {
    Sentry.setExtra("config", error?.config)
  }
  sentryCaptureException(error)

  if (caller) {
    trackApiCall({ caller, api_path, response: "Error" })
  }

  if (error.response) {
    errorObj.status = error.response.status
    errorObj.statusText = error.response.statusText
    errorObj.error = error.response.statusText
  }

  console.log(`error ${errorTitle}`, errorObj)

  return errorObj
}
