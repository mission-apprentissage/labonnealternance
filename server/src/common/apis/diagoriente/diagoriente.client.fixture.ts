import nock from "nock"

import { IDiagorienteClassification, IDiagorienteClassificationResponse } from "@/common/apis/diagoriente/diagoriente.client"

export const generateDiagorienteRomeClassifierBody = () => {}

export const generateDiagorienteRomeClassifierResponse = () => {}

export const nockDiagorienteAccessToken = () => {
  return nock("https://analytics-auth.atlantis.diagotech.dev").post("/realms/esi-auth-keycloack/protocol/openid-connect/token").reply(200, {
    access_token: "access_token",
    expires_in: 300,
    refresh_expires_in: 1800,
    refresh_token: "refresh_token",
    token_type: "Bearer",
    "not-before-policy": 0,
    session_state: "session_state",
    scope: "scope",
  })
}

export function nockDiagorienteRomeClassifier(payload: IDiagorienteClassification, response: IDiagorienteClassificationResponse) {
  return nock("https://semafor.diagoriente.beta.gouv.fr").post("/rome_classifier", payload).matchHeader(`authorization`, `Bearer access_token`).reply(200, response)
}
