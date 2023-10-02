import { createUser } from "@/services/user.service"

export const createAndLogUser = async (httpClient, username, password, options = {}) => {
  await createUser(username, password, { email: `${username}@mail.com`, ...options })

  const response = await httpClient().inject({
    method: "POST",
    path: "/api/login",
    body: { username, password },
  })

  return {
    Authorization: "Bearer " + JSON.parse(response.body).token,
  }
}
