import { ILbaItemLbaCompany } from "@/../shared"

import { apiGet } from "@/utils/api.utils"

const fetchLbaCompanyDetails = async (company): Promise<ILbaItemLbaCompany> => {
  const response = await apiGet("/v1/jobs/company/:siret", { params: { siret: company.id } })

  if (response?.lbaCompanies?.length) {
    response.lbaCompanies[0].detailsLoaded = true
    return response.lbaCompanies[0]
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchLbaCompanyDetails
