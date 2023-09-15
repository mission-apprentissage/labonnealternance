interface ILbaCompany {
  siret: string
  recruitment_potential: number
  raison_sociale: string
  enseigne: string
  naf_code: string
  naf_label: string
  rome_codes: string[]
  street_number: string
  street_name: string
  insee_city_code: string
  zip_code: string
  city: string
  geo_coordinates: string
  email: string
  phone: string
  company_size: string
  website: string
  algorithm_origin: string
  opco: string
  opco_short_name: string
  opco_url: string
  created_at: Date
  last_update_at: Date
  distance?: [number]
}

export { ILbaCompany }
