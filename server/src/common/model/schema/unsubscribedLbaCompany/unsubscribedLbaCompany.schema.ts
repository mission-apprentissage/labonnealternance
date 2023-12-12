import { IUnsubscribedLbaCompany } from "shared"

import { model, Schema } from "../../../mongodb.js"
import { lbaCompanySchema } from "../lbaCompany/lbaCompany.schema.js"

const { siret, raison_sociale, enseigne, naf_code, naf_label, rome_codes, insee_city_code, zip_code, city, company_size, created_at, last_update_at } = lbaCompanySchema.obj
const unsubscribedLbaCompanySchema = new Schema<IUnsubscribedLbaCompany>(
  {
    siret,
    raison_sociale,
    enseigne,
    naf_code,
    naf_label,
    rome_codes,
    insee_city_code,
    zip_code,
    city,
    company_size,
    created_at,
    last_update_at,
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
