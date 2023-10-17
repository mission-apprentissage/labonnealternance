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

    await apiCall.save()
  } catch (err) {
    sentryCaptureException(err)
  }
}

export { trackApiCall }
