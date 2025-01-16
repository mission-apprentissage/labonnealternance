import type { ILbaItemFormation, ILbaItemFormationResult } from "shared"

import { apiGet } from "@/utils/api.utils"

export const fetchTrainingDetails = async (training): Promise<ILbaItemFormation> => {
  const response: ILbaItemFormationResult = await apiGet("/v1/formations/formation/:id", { params: { id: training.id }, querystring: {} })

  const [firstTraining] = response.results ?? []
  if (firstTraining) {
    firstTraining.detailsLoaded = true
    return firstTraining
  } else {
    throw new Error("unexpected_error")
  }
}
