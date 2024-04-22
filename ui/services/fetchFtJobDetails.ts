import { ILbaItemFtJob, zRoutes } from "@/../shared"
import { z } from "zod"

import { apiGet } from "@/utils/api.utils"

const zodSchema = zRoutes.get["/v1/jobs/job/:id"].response["200"]

const fetchFtJobDetails = async (job: { id: string }): Promise<ILbaItemFtJob> => {
  const response = await apiGet("/v1/jobs/job/:id", { params: { id: job.id }, querystring: {} })

  const typedResponse = response as z.output<typeof zodSchema>
  const [firstFtJob] = typedResponse?.peJobs ?? []
  if (firstFtJob) {
    firstFtJob.detailsLoaded = true
    return firstFtJob
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchFtJobDetails
