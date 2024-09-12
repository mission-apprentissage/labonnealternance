import { ObjectId } from "bson"

import { ILbaCompany } from "../models"

export function generateLbaCompanyFixture(data: Partial<ILbaCompany>): ILbaCompany {
  return {
    _id: new ObjectId(),
    siret: "11000001500013",
    raison_sociale: null,
    enseigne: "ASSEMBLEE NATIONALE",
    naf_code: "8411Z",
    naf_label: "Administration publique générale",
    rome_codes: [],
    street_number: null,
    street_name: null,
    insee_city_code: null,
    zip_code: null,
    city: null,
    geo_coordinates: "48.860825,2.318606",
    email: null,
    phone: null,
    company_size: null,
    website: null,
    opco: null,
    opco_short_name: null,
    opco_url: null,
    created_at: new Date("2024-07-28T03:05:34.187Z"),
    last_update_at: new Date("2024-07-28T03:05:34.187Z"),
    ...data,
  }
}
