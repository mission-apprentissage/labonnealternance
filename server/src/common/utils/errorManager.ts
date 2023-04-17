// @ts-nocheck
import Sentry from "@sentry/node"
import { trackApiCall } from "./sendTrackingEvent.js"
import { sentryCaptureException } from "./sentryUtils.js"

const manageApiError = ({ error, api_path, caller, errorTitle }) => {
  const errorObj = { result: "error", error: "error", message: error.message }
  const status = error?.response?.status || ""
  error.name = `API error ${status ? status + " " : ""}${errorTitle}`
  if (error?.config) {
    Sentry.setExtra("config", error?.config)
  }
  sentryCaptureException(error)

  if (caller) {
    trackApiCall({ caller, api_path, response: "Error", status })
  }

  if (error.response) {
    errorObj.status = error.response.status
    errorObj.statusText = error.response.statusText
    errorObj.error = error.response.statusText
  }

  console.log(`error ${errorTitle}`, errorObj)

  return errorObj
}

export { manageApiError }
