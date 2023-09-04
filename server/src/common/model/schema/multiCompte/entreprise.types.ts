import { Entity } from "../../generic/Entity.js"
import { IGlobalAddress } from "../_shared/shared.types.js"

export type Entreprise = Entity & {
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
  origin: string
  is_qualiopi: boolean
}
