import { ILbaItemFtJob } from "@/../shared"

import { apiGet } from "@/utils/api.utils"

const fetchFtJobDetails = async (job): Promise<ILbaItemFtJob> => {
  const response = await apiGet("/v1/jobs/job/:id", { params: { id: job.id }, querystring: {} })

  if (response?.peJobs?.length) {
    response.peJobs[0].detailsLoaded = true
    return response.peJobs[0]
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchFtJobDetails
