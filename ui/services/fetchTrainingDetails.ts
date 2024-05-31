import { ILbaItemFormation, ILbaItemFormationResult } from "shared"

import { apiGet } from "@/utils/api.utils"

const fetchTrainingDetails = async (training): Promise<ILbaItemFormation> => {
  // KBA 2024-05-31 API should return a single object and not an array as we are only fetching a single object
  const response: ILbaItemFormationResult = await apiGet("/v1/formations/formation/:id", { params: { id: training.id }, querystring: {} })

  const [firstTraining] = response?.results ?? []
  if (firstTraining) {
    firstTraining.detailsLoaded = true
    return firstTraining
  } else {
    throw new Error("unexpected_error")
  }
}

export default fetchTrainingDetails
