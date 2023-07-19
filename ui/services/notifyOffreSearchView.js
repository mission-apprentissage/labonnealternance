import axios from "axios"

export const notifyOffreSearchView = async (jobIds) => {
  const url = `/api/v1/jobs/matcha/bulk/stats/view-search`
  const response = await axios.post(url, {
    jobIds,
  })
  if (response.status !== 200) {
    console.error(`error while calling ${url}: status=${response.status}`, response)
  }
}
