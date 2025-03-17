import { OPCOS_LABEL } from "../constants/recruteur.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

export const ZComputedUserAccess = z
  .object({
    admin: z.boolean(),
    users: z.array(z.string()),
    entreprises: z.array(z.string()),
    cfas: z.array(z.string()),
    opcos: z.array(extensions.buildEnum(OPCOS_LABEL)),
    partner_label: z.array(z.string()),
  })
  .strict()

export type ComputedUserAccess = z.output<typeof ZComputedUserAccess>
