import axios from "axios"

import { offreApi } from "@/components/SearchForTrainingsAndJobs/services/utils"

export default async function fetchFtJobDetails(job) {
  const res = null
  if (!job) {
    return res
  }
  const ftJobApi = `${offreApi}/${encodeURIComponent(job.id)}`
  const response = await axios.get(ftJobApi)
  return response.data.peJobs[0]
}
