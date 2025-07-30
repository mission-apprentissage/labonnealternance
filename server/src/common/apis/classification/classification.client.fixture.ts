import nock from "nock"
import { IClassificationLabResponse } from "shared/models/cacheClassification.model"

import config from "@/config"

export function nockLabClassification(payload: string, response: IClassificationLabResponse) {
  return nock(config.labonnealternanceLab.baseUrl).post("/score", { text: payload }).reply(200, response)
}
