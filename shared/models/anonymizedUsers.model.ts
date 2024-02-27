import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const zAnonymizedUser = z
  .object({
    _id: zObjectId,
    role: z.string(),
    type: z.string(),
    last_action_date: z.date(),
  })
  .strict()

export type IAnonymizedUser = z.output<typeof zAnonymizedUser>
