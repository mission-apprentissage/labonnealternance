import { z } from "zod"

import { IModelDescriptor } from "./common"

const collectionName = "rolemanagement360" as const

const ZRoleManagement360 = z.any()

export default {
  zod: ZRoleManagement360,
  indexes: [[{ role_last_status: 1, user_last_status: 1, role_authorized_type: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor