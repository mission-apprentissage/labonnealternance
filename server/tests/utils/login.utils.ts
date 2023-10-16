import { IUserRecruteur } from "shared/models"

import { createMagicLinkToken } from "@/common/utils/jwtUtils"
import { Server } from "@/http/server"
import { createUser } from "@/services/userRecruteur.service"

export const createAndLogUser = async (httpClient: () => Server, username: string, password: string, options: Partial<IUserRecruteur> = {}) => {
  const email = `${username}@mail.com`
  await createUser({ username, password, email, ...options })

  const response = await httpClient().inject({
    method: "POST",
    path: "/api/login/verification",
    query: { token: createMagicLinkToken(email) },
  })

  return {
    Cookie: response.cookies.reduce((acc, cookie) => `${acc} ${cookie.name}=${cookie.value}`, ""),
  }
}
