import Boom from "boom"
import jwt from "jsonwebtoken"
import { z } from "zod"

import { logger } from "@/common/logger"
import config from "@/config"

import { sentryCaptureException } from "../common/utils/sentryUtils"

const { JsonWebTokenError, TokenExpiredError } = jwt

const jwtPublicKey = config.auth.apiApprentissage.publicKey
const jwtTestingPrivateKey = config.auth.apiApprentissage.privateTestKey

const ZApiApprentissageTokenData = z.object({
  email: z.string().email(),
})

export type ApiApprentissageTokenData = z.output<typeof ZApiApprentissageTokenData>

export const parseApiApprentissageToken = (jwtToken: string): ApiApprentissageTokenData => {
  try {
    const { payload } = jwt.verify(jwtToken, jwtPublicKey, {
      complete: true,
      algorithms: ["ES512"],
    })
    const parseResult = ZApiApprentissageTokenData.safeParse(payload)
    if (!parseResult.success) {
      throw Boom.forbidden("Payload doesn't match expected schema")
    }
    return parseResult.data
  } catch (err: unknown) {
    if (err instanceof TokenExpiredError) {
      throw Boom.forbidden("JWT expired")
    }
    if (err instanceof JsonWebTokenError) {
      logger.warn("invalid jwt token", jwtToken, err)
      throw Boom.forbidden()
    }
    if (err instanceof Error && Boom.isBoom(err)) {
      sentryCaptureException(err)
      throw Boom.forbidden()
    }
    const e = Boom.internal()
    e.cause = err
    sentryCaptureException(e)
    throw Boom.unauthorized()
  }
}

export const getApiApprentissageTestingToken = (payload: ApiApprentissageTokenData) => {
  return jwt.sign(payload, jwtTestingPrivateKey, { algorithm: "ES512" })
}
