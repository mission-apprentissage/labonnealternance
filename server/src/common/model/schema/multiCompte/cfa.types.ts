import { VALIDATION_UTILISATEUR } from "../../../../services/constant.service.js"
import { Entity } from "../../generic/Entity.js"
import { IGlobalAddress } from "../_shared/shared.types.js"

export enum CFAStatusEventType {
  VALIDE = "VALIDÉ",
  ATTENTE = "EN ATTENTE DE VALIDATION",
  ERROR = "ERROR",
}

export type CFAStatusEvent = {
  validation_type: VALIDATION_UTILISATEUR
  status: CFAStatusEventType
  reason: string
  granted_by?: string
  date: Date
}

export type CFA = Entity & {
  establishment_siret: string
  establishment_raison_sociale?: string
  establishment_enseigne?: string
  address_detail?: IGlobalAddress
  address?: string
  geo_coordinates?: string
  origin?: string
  is_qualiopi: boolean
  history: CFAStatusEvent[]
}
