import { Entity } from "../../generic/Entity.js"
import { IGlobalAddress } from "../_shared/shared.types.js"

export type CFA = Entity & {
  establishment_raison_sociale: string
  establishment_enseigne: string
  establishment_siret: string
  address_detail: IGlobalAddress
  address: string
  geo_coordinates: string
  origin: string
  is_qualiopi: boolean
}
