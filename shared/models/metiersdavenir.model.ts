import { z } from "../helpers/zodWithOpenApi.js"

export const ZMetierDAvenir = z
  .object({
    codeROME: z.string(),
    title: z.string(),
  })
  .strict()

export const ZMetiersDAvenir = z
  .object({
    suggestionsMetiersAvenir: z.array(ZMetierDAvenir),
  })
  .strict()

export type IMetiersDavenir = z.output<typeof ZMetiersDAvenir>
