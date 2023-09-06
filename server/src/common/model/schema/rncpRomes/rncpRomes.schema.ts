import { model, Schema } from "../../../mongodb"

import { IRncpRomes } from "./rncpRomes.types"

export const rncpRomesSchema = new Schema<IRncpRomes>({
  rncp_code: {
    type: String,
    default: null,
    description: "Un code RNCP",
    index: true,
  },
  rome_codes: {
    type: [String],
    default: null,
    description: "Liste des codes ROMEs assoiés à un code rncp",
  },
})

export default model<IRncpRomes>("rncpromes", rncpRomesSchema)
