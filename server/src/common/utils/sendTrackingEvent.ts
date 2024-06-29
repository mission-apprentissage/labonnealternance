import { ObjectId } from "mongodb"
import { IApiCall } from "shared/models"

import { getDbCollection } from "./mongodbUtils"
import { sentryCaptureException } from "./sentryUtils"

export const trackApiCall = async ({
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
  training_count?: number
  job_count?: number
  result_count?: number
}) => {
  try {
    const apiCallParams: IApiCall = {
      _id: new ObjectId(),
      created_at: new Date(),
      caller,
      api_path,
      training_count,
      job_count,
      result_count,
      response,
    }

    await getDbCollection("apicalls").insertOne(apiCallParams)
  } catch (err) {
    sentryCaptureException(err)
  }
}
