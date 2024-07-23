import { z } from "zod"

import { IModelDescriptor } from "./common"

const collectionName = "internalJobs" as const

const ZInternalJobs = z.any()

export default {
  zod: ZInternalJobs,
  indexes: [
    [{ type: 1, scheduled_for: 1 }, {}],
    [{ type: 1, status: 1, scheduled_for: 1 }, {}],
    [{ type: 1, status: 1, worker_id: 1, started_at: 1 }, {}],
    [{ type: 1, name: 1 }, {}],
    [{ ended_at: 1 }, { expireAfterSeconds: 3600 * 24 * 90 }],
  ],
  collectionName,
} as const satisfies IModelDescriptor
