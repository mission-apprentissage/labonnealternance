import { Entity } from "../../generic/Entity.js"
import { IGlobalAddress } from "../_shared/shared.types.js"

export type Entreprise = Entity & {
  establishment_siret: string
  opco?: string
  idcc?: string
  establishment_raison_sociale?: string
  establishment_enseigne?: string
  address_detail?: IGlobalAddress
  address?: string
  geo_coordinates?: string
  origin?: string
  establishment_id?: string
}
