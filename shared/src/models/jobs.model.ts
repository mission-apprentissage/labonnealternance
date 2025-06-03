import { z } from "zod"

import { IModelDescriptor } from "./common.js"

const collectionName = "jobs" as const

const ZJobs = z.any()

export default {
  zod: ZJobs,
  indexes: [
    [{ jobId: 1 }, {}],
    [{ recruiterStatus: 1, job_creation_date: 1, job_status: 1, mer_sent: 1 }, {}],
  ],
  collectionName,
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
