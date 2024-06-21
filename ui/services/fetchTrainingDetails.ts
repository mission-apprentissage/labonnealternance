import { ILbaItemFormation, zRoutes } from "shared"
import { z } from "zod"

import { apiGet } from "@/utils/api.utils"

const zodSchema = zRoutes.get["/v1/formations/formation/:id"].response["200"]

export const fetchTrainingDetails = async (training): Promise<ILbaItemFormation> => {
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
