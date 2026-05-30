import nock from "nock"
import type { IDiagorienteClassificationResponseSchema, IDiagorienteClassificationSchema } from "shared"

export const mockDiagoriente = () => {
  const tokenMock = nock("https://analytics-auth.atlantis.diagotech.dev/realms/esi-auth-keycloack/protocol/openid-connect").persist().post(new RegExp("/token", "g")).reply(200, {
    access_token: "token",
    expires_in: 10_000,
    refresh_expires_in: 100_000,
    token_type: "type",
    "not-before-policy": 100,
    scope: "scope",
  })

  const classificationMock = nock("https://semafor.diagoriente.fr/classify")
    .persist()
    .post(new RegExp("/SousDomaines", "g"))
    .reply(function (_uri, requestBody) {
      const typedBody = requestBody as IDiagorienteClassificationSchema[]
      const apiResponse: IDiagorienteClassificationResponseSchema = Object.fromEntries(
        typedBody.map(({ id }) => {
          return [
            id,
            {
              classify_results: [
                {
                  data: {
                    _key: "_key",
                    item_version_id: "item_version_id",
                    item_id: "item_id",
                    valid_from: "valid_from",
                    valid_to: "valid_to",
                    item_type: "item_type",
                    titre: "Conducteur / Conductrice d'engins agricoles",
                    rome: "A1101",
                  },
                },
              ],
            },
          ]
        })
      )
      return [
        200,
        JSON.stringify(apiResponse),
        {
          "Content-Type": "application/json",
        },
      ]
    })
  return { tokenMock, classificationMock }
}
