import { IUserRecruteurPublic } from "shared"

import { apiGet } from "@/utils/api.utils"

import { isInitialServerSideProps } from "./isInitialServerSideProps"

export const getAuthServerSideProps = async (context) => {
  if (!isInitialServerSideProps(context) || !context.req.headers.cookie) {
    return {}
  }
  try {
    const user: IUserRecruteurPublic = await apiGet(
      `/auth/session`,
      {},
      {
        headers: context.req.headers,
      }
    )
    const userAccess = await apiGet(
      `/auth/access`,
      {},
      {
        headers: context.req.headers,
      }
    )
    return { user, userAccess }
  } catch (e) {
    return { user: null, userAccess: null }
  }
}
