import { Jsonify } from "type-fest"

import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZEmailBlacklist = z
  .object({
    _id: zObjectId,
    email: z.string(),
    blacklisting_origin: z.string(),
    created_at: z.coerce.date(),
  })
  .strict()

export type IEmailBlacklist = z.output<typeof ZEmailBlacklist>
export type IEmailBlacklistJson = Jsonify<z.input<typeof ZEmailBlacklist>>
