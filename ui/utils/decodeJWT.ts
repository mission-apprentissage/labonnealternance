import { JWTPayload, decodeJwt as decodeJwtBase } from "jose"

export default function decodeJwt(token: string): JWTPayload & { token: string } {
  return {
    token,
    ...decodeJwtBase(token),
  }
}
