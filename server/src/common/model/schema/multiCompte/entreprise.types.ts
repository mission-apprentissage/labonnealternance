import { VALIDATION_UTILISATEUR } from "../../../../services/constant.service.js"
import { Entity } from "../../generic/Entity.js"
import { IGlobalAddress } from "../_shared/shared.types.js"

export enum EntrepriseStatusEventType {
  VALIDE = "VALIDÉ",
  ATTENTE = "EN ATTENTE DE VALIDATION",
  ERROR = "ERROR",
}

export type EntrepriseStatusEvent = {
  validation_type: VALIDATION_UTILISATEUR
  status: EntrepriseStatusEventType
  reason: string
  granted_by?: string
  date: Date
}

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
  history: EntrepriseStatusEvent[]
}
