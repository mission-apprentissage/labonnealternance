import nock from "nock"
import type { IClassificationLabBatchResponse } from "shared/models/cacheClassification.model"

import type { IGetLabClassificationBatch } from "./classification.client"
import config from "@/config"

export function nockLabClassification(payload: IGetLabClassificationBatch, response: IClassificationLabBatchResponse) {
  return nock(config.labonnealternanceLab.baseUrl).post("/scores", { items: payload }).reply(200, response)
}
