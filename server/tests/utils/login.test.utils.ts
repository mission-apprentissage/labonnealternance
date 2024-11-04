import { OPCOS_LABEL } from "shared/constants"
import { IUserWithAccount } from "shared/models/userWithAccount.model"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { Server } from "@/http/server"
import { userWithAccountToUserForToken } from "@/security/accessTokenService"
import { createAuthMagicLinkToken } from "@/services/appLinks.service"

import { saveAdminUserTest, saveCfaUserTest, saveOpcoUserTest, validatedUserStatus } from "./user.test.utils"

export const createAndLogUser = async (httpClient: () => Server, username: string, { type }: { type: "CFA" | "ADMIN" | "OPCO" }) => {
  const email = `${username.toLowerCase()}@mail.com`
  let user: IUserWithAccount
  switch (type) {
    case "ADMIN": {
      const result = await saveAdminUserTest({ email, status: validatedUserStatus })
      user = result.user
      break
    }
    case "CFA": {
      const result = await saveCfaUserTest({ email })
      user = result.user
      break
    }
    case "OPCO": {
      const result = await saveOpcoUserTest(OPCOS_LABEL.AKTO, email)
      user = result.user
      break
    }
    default:
      throw new Error(`Unsupported type ${type}`)
  }

  const response = await httpClient().inject({
    method: "POST",
    path: "/api/login/verification",
    headers: { authorization: `Bearer ${createAuthMagicLinkToken(userWithAccountToUserForToken(user))}` },
  })
  return {
    bearerToken: {
      Cookie: response.cookies.reduce((acc, cookie) => `${acc} ${cookie.name}=${cookie.value}`, ""),
    },
    user,
  }
}

export const logUser = async (httpClient: () => Server, username: string) => {
  const user = await getDbCollection("userswithaccounts").findOne({ email: `${username.toLowerCase()}@mail.com` })

  if (!user) {
    throw Error("user not found")
  }

  const response = await httpClient().inject({
    method: "POST",
    path: "/api/login/verification",
    headers: { authorization: `Bearer ${createAuthMagicLinkToken(userWithAccountToUserForToken(user))}` },
  })
  return {
    bearerToken: {
      Cookie: response.cookies.reduce((acc, cookie) => `${acc} ${cookie.name}=${cookie.value}`, ""),
    },
    user,
  }
}
