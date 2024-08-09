import { IUserWithAccount } from "shared/models/userWithAccount.model"

import { Server } from "@/http/server"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { createAuthMagicLinkToken } from "@/services/appLinks.service"

import { saveAdminUserTest, saveCfaUserTest } from "./user.test.utils"

export const createAndLogUser = async (httpClient: () => Server, username: string, { type }: { type: "CFA" | "ADMIN" }) => {
  const email = `${username.toLowerCase()}@mail.com`
  let user: IUserWithAccount
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
    headers: { authorization: `Bearer ${createAuthMagicLinkToken(userWithAccountToUserForToken(user))}` },
  })
  return {
    Cookie: response.cookies.reduce((acc, cookie) => `${acc} ${cookie.name}=${cookie.value}`, ""),
  }
}
