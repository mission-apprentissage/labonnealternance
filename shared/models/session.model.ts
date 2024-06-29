import { Jsonify } from "type-fest"

import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

export const ZSession = z
  .object({
    _id: zObjectId,
    token: z.string().describe("Token de la session"),
    updated_at: z.date().optional().describe("Date de mise à jour en base de données"),
    created_at: z.date().optional().describe("Date d'ajout en base de données"),
    expires_at: z.date().optional().describe("Date d'expiration en base de données"),
  })
  .strict()

export type ISession = z.output<typeof ZSession>
export type ISessionJson = Jsonify<z.input<typeof ZSession>>

export default {
  zod: ZSession,
  indexes: [
    [{ token: 1 }, {}],
    // TODO
    // [{ expires_at: 1 }, { expireAfterSeconds: config.auth.session.cookie.maxAge / 100 }],
  ],
  collectionName: "sessions" as const,
} as const satisfies IModelDescriptor
