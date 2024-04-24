import { OPCOS } from "../constants/recruteur"
import { z } from "../helpers/zodWithOpenApi"

import { enumToZod } from "./enumToZod"

export const ZComputedUserAccess = z
  .object({
    admin: z.boolean(),
    users: z.array(z.string()),
    entreprises: z.array(z.string()),
    cfas: z.array(z.string()),
    opcos: z.array(enumToZod(OPCOS)),
  })
  .strict()

export type ComputedUserAccess = z.output<typeof ZComputedUserAccess>
