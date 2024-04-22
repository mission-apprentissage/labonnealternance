import { ILbaItemLbaCompany, zRoutes } from "@/../shared"
import { z } from "zod"

import { apiGet } from "@/utils/api.utils"

const zodSchema = zRoutes.get["/v1/jobs/company/:siret"].response["200"]

const fetchLbaCompanyDetails = async (company): Promise<ILbaItemLbaCompany> => {
  const response = await apiGet("/v1/jobs/company/:siret", { params: { siret: company.id }, querystring: {} })

  const typedResponse = response as z.output<typeof zodSchema>
  const [firstLbaCompany] = typedResponse?.lbaCompanies ?? []
  if (firstLbaCompany) {
    firstLbaCompany.detailsLoaded = true
    return firstLbaCompany
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchLbaCompanyDetails
