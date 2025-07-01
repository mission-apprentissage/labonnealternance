import { z } from "zod"

import { IModelDescriptor } from "./common.js"

const collectionName = "resumetokens" as const

const ZResumeTokenData = z.object({
  data: z.string().describe("Token de reprise de flux MongoDB"),
})

export const ZResumeToken = z
  .object({
    resumeTokenData: ZResumeTokenData,
    collection: z.string().describe("Nom de la collection pour laquelle le token est stocké"),
    updatedAt: z.date(),
  })
  .strict()

export type IResumeToken = z.output<typeof ZResumeToken>
export type IResumeTokenData = z.output<typeof ZResumeTokenData>

export default {
  zod: ZResumeToken,
  indexes: [[{ collection: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor
