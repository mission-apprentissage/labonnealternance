import { ILbaItemPartnerJob, ILbaItemPartnerJobReturnedByAPI } from "@/../shared"

import { apiGet } from "@/utils/api.utils"

const fetchPartnerJobDetails = async (partnerJob): Promise<ILbaItemPartnerJob> => {
  const response: ILbaItemPartnerJobReturnedByAPI = await apiGet("/v1/jobs/partnerJob/:id", { params: { id: partnerJob.id }, querystring: {} })

  const [firstPartnerJob] = response?.partnerJobs ?? []
  if (firstPartnerJob) {
    firstPartnerJob.detailsLoaded = true
    return firstPartnerJob
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchPartnerJobDetails
