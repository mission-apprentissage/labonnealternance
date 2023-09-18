import { createUser } from "@/services/user.service"

export const createAndLogUser = async (httpClient, username, password, options = { }) => {
  await createUser(username, password, { email: `${username}@mail.com`, ...options })

  const response = await httpClient().post("/api/login")
    .send({username, password })

  return {
    Authorization: "Bearer " + response.body.token,
  }
}
