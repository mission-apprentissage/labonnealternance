import Boom from "boom"
import jwt from "jsonwebtoken"
import { z } from "zod"

import config from "@/config"

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
    const apiData = ZApiApprentissageTokenData.parse(payload)
    return apiData
  } catch (err: any) {
    const errorStr = err + ""
    if (errorStr === "TokenExpiredError: jwt expired") {
      throw Boom.forbidden("JWT expired")
    }
    console.warn("invalid jwt token", jwtToken, err)
    throw Boom.forbidden()
  }
}
