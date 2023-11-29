import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZRncpRomes = z
  .object({
    _id: zObjectId,
    rncp_code: z.string(),
    rome_codes: z.array(z.string()),
  })
  .strict()

export type IRncpRomes = z.output<typeof ZRncpRomes>
