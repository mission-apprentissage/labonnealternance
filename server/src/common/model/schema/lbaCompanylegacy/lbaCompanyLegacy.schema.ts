import { ILbaLegacyCompany } from "shared"

import { Schema, model } from "../../../mongodb"
import { lbaCompanySchema } from "../lbaCompany/lbaCompany.schema"

export const lbaCompanyLegacySchema = new Schema<ILbaLegacyCompany>(
  {
    siret: {
      type: String,
      require: true,
      description: "Le Siret de la société",
      index: true,
    },
    email: {
      type: String,
      default: null,
      description: "Adresse email de contact",
    },
  },
  {
    versionKey: false,
  }
)
// @ts-ignore
export default model<ILbaLegacyCompany>("bonnesboiteslegacy", lbaCompanySchema)
