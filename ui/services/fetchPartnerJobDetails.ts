import { ILbaItemPartnerJobJson, ILbaItemPartnerJobReturnedByAPI } from "shared"

import { apiGet } from "@/utils/api.utils"

const fetchPartnerJobDetails = async (partnerJob): Promise<ILbaItemPartnerJobJson> => {
  const response: ILbaItemPartnerJobReturnedByAPI = await apiGet("/v1/jobs/partnerJob/:id", { params: { id: partnerJob.id }, querystring: {} })

  // @ts-expect-error
  const [firstPartnerJob]: [ILbaItemPartnerJobJson] = response?.partnerJobs ?? []
  if (firstPartnerJob) {
    firstPartnerJob.detailsLoaded = true
    return firstPartnerJob
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchPartnerJobDetails
