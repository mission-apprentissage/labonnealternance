import axios from "axios"

import { companyApi } from "@/components/SearchForTrainingsAndJobs/services/utils"

export default async function fetchLbaCompanyDetails(company) {
  const res = null
  if (!company) {
    return res
  }
  const lbaCompanyApi = `${companyApi}/${encodeURIComponent(company.id)}`
  const response = await axios.get(lbaCompanyApi)
  return response.data.lbaCompanies[0]
}
