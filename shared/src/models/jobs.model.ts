import { z } from "zod"

import { IModelDescriptor } from "./common.js"

const collectionName = "jobs" as const

const ZJobs = z.any()

export default {
  zod: ZJobs,
  indexes: [[{ jobId: 1 }, {}]],
  collectionName,
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
