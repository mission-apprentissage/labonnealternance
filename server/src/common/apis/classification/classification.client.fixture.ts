import nock from "nock"
import type { IClassificationLabBatchResponse } from "shared/models/cacheClassification.model"
import config from "@/config"
import type { IGetLabClassificationBatch } from "./classification.client"

export function nockLabClassification(payload: IGetLabClassificationBatch, response: IClassificationLabBatchResponse) {
  return nock(config.labonnealternanceLab.baseUrl).post("/model/scores", { items: payload }).reply(200, response)
}
