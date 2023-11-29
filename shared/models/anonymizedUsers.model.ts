import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const zAnonymizedUser = z
  .object({
    _id: zObjectId,
    username: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    phone: z.string(),
    email: z.string(),
    role: z.string(),
    type: z.string(),
    last_action_date: z.date(),
    is_anonymized: z.boolean(),
  })
  .strict()

export type IAnonymizedUser = z.output<typeof zAnonymizedUser>
