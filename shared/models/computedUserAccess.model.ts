import { OPCOS_LABEL } from "../constants/recruteur"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

export const ZComputedUserAccess = z
  .object({
    admin: z.boolean(),
    users: z.array(z.string()),
    entreprises: z.array(z.string()),
    cfas: z.array(z.string()),
    opcos: z.array(extensions.buildEnum(OPCOS_LABEL)),
    partnerLabel: z.array(z.string()),
  })
  .strict()

export type ComputedUserAccess = z.output<typeof ZComputedUserAccess>
