import { IRncpRomes } from "shared"

import { model, Schema } from "../../../mongodb"

export const rncpRomesSchema = new Schema<IRncpRomes>(
  {
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
  },
  {
    versionKey: false,
  }
)

export default model<IRncpRomes>("rncpromes", rncpRomesSchema)
