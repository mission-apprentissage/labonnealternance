import { ILbaCompany } from "shared"

import { Schema, model } from "../../../mongodb"
import { lbaCompanySchema } from "../lbaCompany/lbaCompany.schema.js"

export const lbaCompanyLegacySchema = new Schema<Pick<ILbaCompany, "siret" | "email">>({
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
})
export default model<Pick<ILbaCompany, "siret" | "email">>("bonnesboiteslegacy", lbaCompanySchema)
