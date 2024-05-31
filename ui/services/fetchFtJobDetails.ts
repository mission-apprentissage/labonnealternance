import { ILbaItemFtJob, ILbaItemFtJobReturnedByAPI } from "@/../shared"

import { apiGet } from "@/utils/api.utils"

const fetchFtJobDetails = async (job: { id: string }): Promise<ILbaItemFtJob> => {
  // KBA 2024-05-31 API should return a single object and not an array as we are only fetching a single object
  const response: ILbaItemFtJobReturnedByAPI = await apiGet("/v1/jobs/job/:id", { params: { id: job.id }, querystring: {} })

  const [firstFtJob] = response?.peJobs ?? []
  if (firstFtJob) {
    firstFtJob.detailsLoaded = true
    return firstFtJob
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchFtJobDetails
