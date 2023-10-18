import { IUserRecruteur } from "shared/models"

import { Server } from "@/http/server"
import { createAuthMagicLinkToken } from "@/services/appLinks.service"
import { createUser } from "@/services/userRecruteur.service"

export const createAndLogUser = async (httpClient: () => Server, username: string, password: string, options: Partial<IUserRecruteur> = {}) => {
  const email = `${username}@mail.com`
  const user = await createUser({ username, password, email, ...options })

  const response = await httpClient().inject({
    method: "POST",
    path: "/api/login/verification",
    headers: { authorization: `Bearer ${createAuthMagicLinkToken(user)}` },
  })

  return {
    Cookie: response.cookies.reduce((acc, cookie) => `${acc} ${cookie.name}=${cookie.value}`, ""),
  }
}
