import { ILbaItemLbaJob, zRoutes } from "shared"
import { z } from "zod"

import { apiGet } from "@/utils/api.utils"

const zodSchema = zRoutes.get["/v1/jobs/matcha/:id"].response["200"]

const fetchLbaJobDetails = async (job): Promise<ILbaItemLbaJob> => {
  const response = await apiGet("/v1/jobs/matcha/:id", { params: { id: job.id }, querystring: {} })
  const typedResponse = response as z.output<typeof zodSchema>
  const [firstMatcha] = typedResponse?.matchas ?? []
  if (firstMatcha) {
    firstMatcha.detailsLoaded = true
    return firstMatcha
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchLbaJobDetails
