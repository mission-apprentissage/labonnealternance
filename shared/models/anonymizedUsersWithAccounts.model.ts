import { z } from "zod"

import { IModelDescriptor } from "./common"

export default {
  zod: z.any(),
  indexes: [],
  collectionName: "anonymized_userswithaccounts",
} as const satisfies IModelDescriptor
