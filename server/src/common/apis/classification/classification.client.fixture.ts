import nock from "nock"
import { IClassificationLabBatchResponse } from "shared/models/cacheClassification.model"

import { IGetLabClassificationBatch } from "@/common/apis/classification/classification.client"
import config from "@/config"

export function nockLabClassification(payload: IGetLabClassificationBatch, response: IClassificationLabBatchResponse) {
  return nock(config.labonnealternanceLab.baseUrl).post("/scores", { items: payload }).reply(200, response)
}
