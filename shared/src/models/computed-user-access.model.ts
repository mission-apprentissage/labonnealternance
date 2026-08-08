import { OPCOS_LABEL } from "../constants/recruteur.js"
import { extensions } from "../helpers/zod-helpers/zod-primitives.js"
import { z } from "../helpers/zod-with-open-api.js"

export const ZComputedUserAccess = z.strictObject({
  admin: z.boolean(),
  users: z.array(z.string()),
  entreprises: z.array(z.string()),
  cfas: z.array(z.string()),
  opcos: z.array(extensions.buildEnum(OPCOS_LABEL)),
  partner_label: z.array(z.string()),
})

export type ComputedUserAccess = z.output<typeof ZComputedUserAccess>
