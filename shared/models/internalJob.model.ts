import { z } from "zod"

import { IModelDescriptor } from "./common"

const collectionName = "internalJobs" as const

const ZInternalJobs = z.any()

export default {
  zod: ZInternalJobs,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor
