import env from "env-var"
import jwt from "jsonwebtoken"

import { ApiApprentissageTokenData } from "../../src/security/accessApiApprentissageService"

const jwtTestingPrivateKey = env.get("LBA_API_APPRENTISSAGE_TEST_PRIVATE_KEY").required().asString()

export const getApiApprentissageTestingToken = (payload: ApiApprentissageTokenData) => {
  return jwt.sign(payload, jwtTestingPrivateKey, { algorithm: "ES512" })
}
