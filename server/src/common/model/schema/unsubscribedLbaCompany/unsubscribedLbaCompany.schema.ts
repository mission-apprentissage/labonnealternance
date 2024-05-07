import { IUnsubscribedLbaCompany } from "shared"

import { model, Schema } from "../../../mongodb"

const unsubscribedLbaCompanySchema = new Schema<IUnsubscribedLbaCompany>(
  {
    siret: String,
    raison_sociale: String,
    enseigne: String,
    naf_code: String,
    naf_label: String,
    rome_codes: [String],
    insee_city_code: String,
    zip_code: String,
    city: String,
    company_size: String,
    created_at: Date,
    last_update_at: Date,
    unsubscribe_date: {
      type: Date,
      default: Date.now,
      description: "Date de désinscription",
    },
    unsubscribe_reason: {
      type: String,
      default: null,
      description: "Raison de la désinscription",
    },
  },
  {
    versionKey: false,
  }
)

export const UnsubscribedLbaCompany = model<IUnsubscribedLbaCompany>("unsubscribedbonnesboites", unsubscribedLbaCompanySchema)

export default UnsubscribedLbaCompany
