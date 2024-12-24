import { z } from "zod"

import { IModelDescriptor } from "./common"

export default {
  zod: z.any(),
  indexes: [],
  collectionName: "anonymized_applications",
} as const satisfies IModelDescriptor
