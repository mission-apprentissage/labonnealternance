import { ApiCalls } from "../model/index"

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

    apiCall.save()
  } catch (err) {
    console.log("Error tracking api call.", err)
  }
}

export { trackApiCall }
