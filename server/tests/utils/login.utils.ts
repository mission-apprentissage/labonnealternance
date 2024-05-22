import { IUser2 } from "shared/models/user2.model"

import { Server } from "@/http/server"
import { user2ToUserForToken } from "@/security/accessTokenService"
import { createAuthMagicLinkToken } from "@/services/appLinks.service"

import { saveAdminUserTest, saveCfaUserTest } from "./user.utils"

export const createAndLogUser = async (httpClient: () => Server, username: string, { type }: { type: "CFA" | "ADMIN" }) => {
  const email = `${username.toLowerCase()}@mail.com`
  let user: IUser2
  if (type === "ADMIN") {
    const result = await saveAdminUserTest({ email })
    user = result.user
  } else if (type === "CFA") {
    const result = await saveCfaUserTest({ email })
    user = result.user
  } else {
    throw new Error(`Unsupported type ${type}`)
  }

  const response = await httpClient().inject({
    method: "POST",
    path: "/api/login/verification",
    headers: { authorization: `Bearer ${createAuthMagicLinkToken(user2ToUserForToken(user))}` },
  })
  return {
    Cookie: response.cookies.reduce((acc, cookie) => `${acc} ${cookie.name}=${cookie.value}`, ""),
  }
}
