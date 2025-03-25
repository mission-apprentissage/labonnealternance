import { ILbaItemLbaCompanyJson, ILbaItemLbaCompanyReturnedByAPI } from "shared"

import { apiGet } from "@/utils/api.utils"

const fetchLbaCompanyDetails = async (company): Promise<ILbaItemLbaCompanyJson> => {
  // KBA 2024-05-31 API should return a single object and not an array as we are only fetching a single object
  const response: ILbaItemLbaCompanyReturnedByAPI = await apiGet("/v1/jobs/company/:siret", { params: { siret: company.id }, querystring: {} })

  // @ts-expect-error
  const [firstLbaCompany]: [ILbaItemLbaCompanyJson] = response?.lbaCompanies ?? []
  if (firstLbaCompany) {
    firstLbaCompany.detailsLoaded = true
    return firstLbaCompany
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchLbaCompanyDetails
