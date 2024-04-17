import axios from "axios"

import { matchaApi } from "@/components/SearchForTrainingsAndJobs/services/utils"

export default async function fetchLbaJobDetails(job) {
  const res = null
  if (!job) {
    return res
  }
  const lbaJobApi = `${matchaApi}/${encodeURIComponent(job.id)}`
  const response = await axios.get(lbaJobApi)
  return response.data.matchas[0]
}
