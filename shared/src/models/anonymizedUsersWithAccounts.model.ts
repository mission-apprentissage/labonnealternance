import { z } from "zod"

import { IModelDescriptor } from "./common.js"

export default {
  zod: z.any(),
  indexes: [],
  collectionName: "anonymized_userswithaccounts",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor
