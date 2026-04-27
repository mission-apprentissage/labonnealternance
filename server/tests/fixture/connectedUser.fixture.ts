import { generateRoleManagementFixture } from "shared/fixtures/roleManagement.fixture"
import { generateUserWithAccountFixture } from "shared/fixtures/userWithAccount.fixture"
import type { IRoleManagement, IUserWithAccount } from "shared/models/index"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { createSessionToken } from "@/common/utils/session.service"
import config from "@/config"
import { createSession } from "@/services/sessions.service"

export const givenAConnectedOpcoUser = async (opcoProps: Partial<IUserWithAccount> = {}, roleProps: Partial<IRoleManagement> = {}) => {
  const opcoUser = generateUserWithAccountFixture({
    email: "opco@opco.fr",
    ...opcoProps,
  })
  await getDbCollection("userswithaccounts").insertOne(opcoUser)
  const { cookies, token } = await getConnectedInfos(opcoUser.email)
  const role = generateRoleManagementFixture({ user_id: opcoUser._id, ...roleProps })
  await getDbCollection("rolemanagements").insertOne(role)
  return { user: opcoUser, token, cookies, role }
}

export const getConnectedInfos = async (email: string) => {
  const token = createSessionToken(email)
  await createSession({ token })
  const cookies = {
    [config.auth.session.cookieName]: token,
  }
  return { cookies, token }
}
