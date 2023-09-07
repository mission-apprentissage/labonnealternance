import { Entity } from "../../generic/Entity.js"
import { IGlobalAddress } from "../_shared/shared.types.js"

export type CFA = Entity & {
  establishment_siret: string
  establishment_raison_sociale?: string
  establishment_enseigne?: string
  address_detail?: IGlobalAddress
  address?: string
  geo_coordinates?: string
  origin?: string
  is_qualiopi: boolean
}
