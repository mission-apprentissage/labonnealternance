import { ETAT_UTILISATEUR, VALIDATION_UTILISATEUR } from "../../../../services/constant.service.js"
import { IGlobalAddress } from "../_shared/shared.types.js"

export interface IUserStatusValidation {
  validation_type: VALIDATION_UTILISATEUR
  status: ETAT_UTILISATEUR
  reason: string
  user: string
  date: Date
}

export interface IUserRecruteur {
  _id: string
  last_name: string
  first_name: string
  opco: string
  idcc: string
  establishment_raison_sociale: string
  establishment_enseigne: string
  establishment_siret: string
  address_detail: IGlobalAddress
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
  status: IUserStatusValidation[]
  last_connection: Date
  createdAt: Date
  updatedAt: Date
}
