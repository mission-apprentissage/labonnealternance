import { IAdresse, IAdresseCFA } from "../_shared/shared.types.js"

interface IUserValidation {
  validation_type: string
  status: string
  reason: string
  user: string
  date: Date
}

interface IUserRecruteur {
  _id: string
  last_name: string
  first_name: string
  opco: string
  idcc: string
  establishment_raison_sociale: string
  establishment_enseigne: string
  establishment_siret: string
  address_detail: IAdresse | IAdresseCFA
  address: string
  geo_coordinates: string
  phone: string
  email: string
  scope: string
  type: string
  establishment_id: string
  origin: string
  is_email_checked: boolean
  is_qualiopi: boolean
  status: IUserValidation[]
  last_connection: Date
  createdAt: Date
  updatedAt: Date
}

export { IUserRecruteur, IUserValidation }
