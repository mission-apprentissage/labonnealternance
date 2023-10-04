import { IUserRecruteurPublic } from "shared"

import { apiGet } from "@/utils/api.utils"

import { isInitialServerSideProps } from "./isInitialServerSideProps"

export const getAuthServerSideProps = async (context) => {
  if (!isInitialServerSideProps(context)) {
    return {}
  }
  try {
    const session: IUserRecruteurPublic = await apiGet(`/auth/session`, {
      headers: context.req.headers,
    })
    return { auth: session }
  } catch (e) {
    return { auth: null }
  }
}
