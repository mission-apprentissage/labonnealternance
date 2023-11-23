import { ZApiCallNew } from "shared/models"

import { ApiCalls } from "../model/index"

import { sentryCaptureException } from "./sentryUtils"

const trackApiCall = async ({
  caller,
  api_path,
  training_count = 0,
  job_count = 0,
  result_count = 0,
  response,
}: {
  caller: string
  api_path: string
  response: string
  training_count: number
  job_count: number
  result_count: number
}) => {
  try {
    const apiCallParams = {
      caller,
      api_path,
      training_count,
      job_count,
      result_count,
      response,
    }

    const apiCall = new ApiCalls(apiCallParams)

    ZApiCallNew.parse(apiCallParams)
    await apiCall.save()
  } catch (err) {
    sentryCaptureException(err)
  }
}

export { trackApiCall }
