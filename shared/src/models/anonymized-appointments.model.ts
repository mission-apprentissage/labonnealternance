import { z } from "zod"

import type { IModelDescriptor } from "./common.js"

export default {
  zod: z.any(),
  indexes: [],
  collectionName: "anonymized_appointments",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
