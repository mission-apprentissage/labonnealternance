import { createApiAlternanceToken, type IApiAlternanceTokenData } from "api-alternance-sdk"
import env from "env-var"

const jwtTestingPrivateKey = env.get("LBA_API_APPRENTISSAGE_TEST_PRIVATE_KEY").required().asString()
const jwtTestingPrivateKeyInvalid = env.get("LBA_API_APPRENTISSAGE_TEST_PRIVATE_KEY_INVALID").required().asString()

export const getApiApprentissageTestingToken = (payload: IApiAlternanceTokenData) => {
  return createApiAlternanceToken({
    data: payload,
    privateKey: jwtTestingPrivateKey,
  })
}

export const getApiApprentissageTestingTokenFromInvalidPrivateKey = (payload: IApiAlternanceTokenData) => {
  return createApiAlternanceToken({
    data: payload,
    privateKey: jwtTestingPrivateKeyInvalid,
  })
}
