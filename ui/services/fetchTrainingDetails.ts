import { ILbaItemFormation2 } from "shared"
import { Jsonify } from "type-fest"

import { apiGet } from "@/utils/api.utils"

export const fetchTrainingDetails = async (training): Promise<Jsonify<ILbaItemFormation2> & { detailsLoaded: true }> => {
  const response = await apiGet("/v1/formations/formation/:id", { params: { id: training.id }, querystring: {} })

  const typedResponse = response as z.output<typeof zodSchema>
  const [firstTraining] = typedResponse?.results ?? []
  if (firstTraining) {
    firstTraining.detailsLoaded = true
    return firstTraining
  } else {
    throw new Error("unexpected_error")
  }
}
