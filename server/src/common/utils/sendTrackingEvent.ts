import { ApiCalls } from "../../common/model/index.js"

const trackApiCall = async ({ caller, api_path, training_count, job_count, result_count, response }) => {
  try {
    let apiCall = new ApiCalls({
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
