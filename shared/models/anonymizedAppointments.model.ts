import { z } from "zod"

import { IModelDescriptor } from "./common"

export default {
  zod: z.any(),
  indexes: [],
  collectionName: "anonymized_appointments",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
