import axios from "axios"

/**
 * notifie le backend que la page de détail de l'offre LBA a été ouverte
 * @param {string} jobId
 */
export const notifyLbaJobDetailView = async (jobId) => {
  const url = `/api/v1/jobs/matcha/${jobId}/stats/view-details`
  const response = await axios.post(url)
  if (response.status !== 200) {
    console.error(`error while calling ${url}: status=${response.status}`, response)
  }
}
