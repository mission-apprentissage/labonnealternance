import { ILbaItemFormation2 } from "shared"
import { Jsonify } from "type-fest"

import { apiGet } from "@/utils/api.utils"

export const fetchTrainingDetails = async (training): Promise<Jsonify<ILbaItemFormation2> & { detailsLoaded: true }> => {
  const response = await apiGet("/formations/formation/:id", { params: { id: training.id }, querystring: {} }, undefined, "V2")
  return { ...response, detailsLoaded: true }
}
