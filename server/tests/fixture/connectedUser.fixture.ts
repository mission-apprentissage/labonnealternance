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
  const token = createSessionToken(opcoUser.email)
  await createSession({ token })
  const cookies = {
    [config.auth.session.cookieName]: token,
  }
  const role = generateRoleManagementFixture({ user_id: opcoUser._id, ...roleProps })
  await getDbCollection("rolemanagements").insertOne(role)
  return { user: opcoUser, token, cookies, role }
}
