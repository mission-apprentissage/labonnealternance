import { ILbaItemLbaJobJson, ILbaItemLbaJobReturnedByAPI } from "shared"

import { apiGet } from "@/utils/api.utils"

const fetchLbaJobDetails = async (job): Promise<ILbaItemLbaJobJson> => {
  // KBA 2024-05-31 API should return a single object and not an array as we are only fetching a single job
  const response: ILbaItemLbaJobReturnedByAPI = await apiGet("/v1/jobs/matcha/:id", { params: { id: job.id }, querystring: {} })

  // @ts-expect-error
  const [firstMatcha]: [ILbaItemLbaJobJson] = response.matchas ?? []
  if (firstMatcha) {
    firstMatcha.detailsLoaded = true
    return firstMatcha
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchLbaJobDetails
