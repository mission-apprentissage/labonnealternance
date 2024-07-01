import Boom from "boom"
import jwt from "jsonwebtoken"
import { z } from "zod"

import { logger } from "@/common/logger"
import config from "@/config"

const { JsonWebTokenError, TokenExpiredError } = jwt

const jwtPublicKey = config.auth.apiApprentissage.publicKey

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
      throw Boom.forbidden("bad token format")
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
      throw err
    }
    const e = Boom.internal()
    e.cause = err
    throw e
  }
}
