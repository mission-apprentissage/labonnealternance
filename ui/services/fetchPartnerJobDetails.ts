import { ILbaItemPartnerJobJson, ILbaItemPartnerJobReturnedByAPI } from "shared"

import { apiGet } from "@/utils/api.utils"

const fetchPartnerJobDetails = async (job): Promise<ILbaItemPartnerJobJson> => {
  const response: ILbaItemPartnerJobReturnedByAPI = await apiGet("/v1/jobs/partnerJob/:id", { params: { id: job.id }, querystring: {} })

  // @ts-expect-error
  const [firstJob]: [ILbaItemPartnerJobJson] = response.partnerJobs ?? []
  if (firstJob) {
    firstJob.detailsLoaded = true
    return firstJob
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchPartnerJobDetails
