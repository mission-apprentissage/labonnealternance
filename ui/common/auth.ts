import { createGlobalState } from "react-hooks-global-state"

import decodeJWT from "../utils/decodeJWT"

import { eAUTHTYPE } from "./contants"

export type IUserPublic = {
  sub: string
  permissions: object
  cfa_delegated_siret?: string
  token?: string
  type?: eAUTHTYPE
  first_name?: string
  last_name?: string
  establishment_id?: string
}

const anonymous = { sub: "anonymous", permissions: {} } as IUserPublic

let token // TODO_AB
if (typeof window !== "undefined") {
  // Perform localStorage action
  token = sessionStorage.getItem("lba:token")
}

const { useGlobalState, getGlobalState } = createGlobalState<{ auth: IUserPublic }>({
  auth: token ? (decodeJWT(token) as IUserPublic) : anonymous,
})

export const getAuth = () => getGlobalState("auth")
export const useAuthState = () => useGlobalState("auth")
export { anonymous }
