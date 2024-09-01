import env from "env-var"
import jwt from "jsonwebtoken"

import { IApiApprentissageTokenData } from "../../src/security/accessApiApprentissageService"

const jwtTestingPrivateKey = env.get("LBA_API_APPRENTISSAGE_TEST_PRIVATE_KEY").required().asString()
const jwtTestingPrivateKeyInvalid = env.get("LBA_API_APPRENTISSAGE_TEST_PRIVATE_KEY_INVALID").required().asString()

export const getApiApprentissageTestingToken = (payload: IApiApprentissageTokenData) => {
  return jwt.sign(payload, jwtTestingPrivateKey, { algorithm: "ES512" })
}

export const getApiApprentissageTestingTokenFromInvalidPrivateKey = (payload: IApiApprentissageTokenData) => {
  return jwt.sign(payload, jwtTestingPrivateKeyInvalid, { algorithm: "ES512" })
}
