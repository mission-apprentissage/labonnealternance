import axios from "axios"

export const notifyOffreDetailView = async (jobId) => {
  const url = `/api/v1/jobs/matcha/${jobId}/stats/view-details`
  const response = await axios.post(url)
  if (response.status !== 200) {
    console.error(`error while calling ${url}: status=${response.status}`, response)
  }
}
