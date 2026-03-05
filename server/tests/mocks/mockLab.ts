import nock from "nock"
import type { IClassificationLabBatchResponse } from "shared/models/cacheClassification.model"
import type { IGetLabClassificationBatch } from "@/common/apis/classification/classification.client"

export const mockLab = () => {
  return nock("https://lab.apprentissage.beta.gouv.fr:443")
    .persist()
    .post(new RegExp("/model/scores", "g"))
    .reply(function (_uri, requestBody) {
      const typedBody = requestBody as { items: IGetLabClassificationBatch }
      const apiResponse: IClassificationLabBatchResponse = typedBody.items.map(({ id }) => ({
        id,
        label: "publish",
        model: "model",
        scores: { publish: 0.9, unpublish: 0.1 },
      }))
      return [
        200,
        JSON.stringify(apiResponse),
        {
          "Content-Type": "application/json",
        },
      ]
    })
}
