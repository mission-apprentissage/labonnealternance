import { z } from "zod"

import { IModelDescriptor } from "./common"

const collectionName = "jobs" as const

const ZJobs = z.any()

export default {
  zod: ZJobs,
  indexes: [[{ jobId: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor
