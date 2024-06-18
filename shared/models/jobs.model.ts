import { z } from "zod"

import { IModelDescriptor } from "./common"

const collectionName = "jobs" as const

const ZJobs = z.any()

export default {
  zod: ZJobs,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
