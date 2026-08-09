import { EApplicantRole, EApplicantType } from "../constants/rdva.js"
import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "users" as const

export const ZUser = z.strictObject({
  _id: zObjectId,
  firstname: z.string(),
  lastname: z.string(),
  phone: z.string(),
  email: z.email(),
  type: z.enum([Object.values(EApplicantType)[0], ...Object.values(EApplicantType).slice(1)]),
  role: z.enum([Object.values(EApplicantRole)[0], ...Object.values(EApplicantRole).slice(1)]),
  last_action_date: z.coerce.date<Date>(),
})

export type IUser = z.output<typeof ZUser>

export default {
  zod: ZUser,
  indexes: [[{ email: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
