import { ICustomEmailETFA } from "shared"

import { model, Schema } from "../../../mongodb"

export const customEmailETFASchema = new Schema<ICustomEmailETFA>(
  {
    email: {
      type: String,
    },
    cle_ministere_educatif: {
      type: String,
      index: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
)

export default model<ICustomEmailETFA>("customEmailETFA", customEmailETFASchema)
