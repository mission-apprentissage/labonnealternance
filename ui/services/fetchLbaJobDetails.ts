import { ILbaItemLbaJob } from "@/../shared"

import { apiGet } from "@/utils/api.utils"

const fetchLbaJobDetails = async (job): Promise<ILbaItemLbaJob> => {
  const response = await apiGet("/v1/jobs/matcha/:id", { params: { id: job.id } })

  if (response?.matchas?.length) {
    response.matchas[0].detailsLoaded = true
    return response.matchas[0]
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchLbaJobDetails
