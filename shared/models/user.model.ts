import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZUser = z
  .object({
    _id: zObjectId,
    username: z.string(),
    password: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    phone: z.string(),
    email: z.string().email(),
    type: z.enum(["candidat", "cfa", "administrator"]),
    role: z.string(),
    last_action_date: z.coerce.date(),
    is_anonymized: z.boolean(),
  })
  .strict()

export type IUser = z.output<typeof ZUser>
