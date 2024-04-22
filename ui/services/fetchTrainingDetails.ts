import { ILbaItemFormation } from "@/../shared"

import { apiGet } from "@/utils/api.utils"

const fetchTrainingDetails = async (training): Promise<ILbaItemFormation> => {
  const response = await apiGet("/v1/formations/formation/:id", { params: { id: training.id }, querystring: {} })

  if (response?.results?.length) {
    response.results[0].detailsLoaded = true
    return response.results[0]
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchTrainingDetails
