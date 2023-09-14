import { decodeJwt } from "jose"

export default (token) => {
  return {
    token,
    ...decodeJwt(token),
  }
}
