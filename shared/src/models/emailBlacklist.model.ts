import { Jsonify } from "type-fest"

import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "emailblacklists" as const

export const ZEmailBlacklist = z
  .object({
    _id: zObjectId,
    email: z.string().email(),
    blacklisting_origin: z.string(),
    created_at: z.coerce.date(),
  })
  .strict()

export type IEmailBlacklist = z.output<typeof ZEmailBlacklist>
export type IEmailBlacklistJson = Jsonify<z.input<typeof ZEmailBlacklist>>

export default {
  zod: ZEmailBlacklist,
  indexes: [[{ email: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor
