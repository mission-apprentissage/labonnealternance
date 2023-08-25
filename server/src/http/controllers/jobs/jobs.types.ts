import { IRecruiter } from "../../../common/model/schema/recruiter/recruiter.types.js"

export type TResponseError = {
  error: boolean
  message: string
}
export type TEstablishmentResponseSuccess = IRecruiter

export type TCreateEstablishmentBody = {
  establishment_siret: string
  first_name: string
  last_name: string
  phone?: string
  email: string
  idcc?: string
  origin?: string
}
export type TJob = {
  job_level_label: string
  job_duration: number
  job_type: string[]
  is_disabled_elligible: boolean
  job_count?: number
  job_rythm?: string
  job_start_date: string
  job_employer_description?: string
  job_description?: string
  custom_address?: string
  custom_geo_coordinates?: string
}

export interface ICreateJobBody extends TJob {
  appellation_code: string
}

export interface IGetDelegation {
  _id: string
  numero_voie: string
  type_voie: string
  nom_voie: string
  code_postal: string
  nom_departement: string
  entreprise_raison_sociale: string
  geo_coordonnees: string
  distance_en_km: string
}
export interface ICreateDelegation {
  establishmentIds: string[]
}
