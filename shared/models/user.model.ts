import { EApplicantRole, EApplicantType } from "../constants/rdva"
import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZUser = z
  .object({
    _id: zObjectId,
    firstname: z.string(),
    lastname: z.string(),
    phone: z.string(),
    email: z.string().email(),
    type: z.enum([Object.values(EApplicantType)[0], ...Object.values(EApplicantType).slice(1)]),
    role: z.enum([Object.values(EApplicantRole)[0], ...Object.values(EApplicantRole).slice(1)]),
    last_action_date: z.coerce.date(),
  })
  .strict()

export type IUser = z.output<typeof ZUser>
