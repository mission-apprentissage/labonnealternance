// eslint-disable-next-line import/no-extraneous-dependencies
import { decodeJwt } from "jose" // TODO_AB

// eslint-disable-next-line import/no-anonymous-default-export
export default (token) => {
  return {
    token,
    ...decodeJwt(token),
  }
}
