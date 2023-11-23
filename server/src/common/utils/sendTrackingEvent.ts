import { ZApiCall } from "shared/models"

import { ApiCalls } from "../model/index"

import { sentryCaptureException } from "./sentryUtils"

const trackApiCall = async ({
  caller,
  api_path,
  training_count,
  job_count,
  result_count,
  response,
}: {
  caller: string
  api_path: string
  response: string
  training_count?: number
  job_count?: number
  result_count?: number
}) => {
  try {
    const apiCall = new ApiCalls({
      caller,
      api_path,
      training_count,
      job_count,
      result_count,
      response,
    })

    ZApiCall.parse(apiCall)
    await apiCall.save()
  } catch (err) {
    sentryCaptureException(err)
  }
}

export { trackApiCall }
