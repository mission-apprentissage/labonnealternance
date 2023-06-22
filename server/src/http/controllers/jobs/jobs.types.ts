import { IRecruiter } from "../../../common/model/schema/recruiter/recruiter.types.js"

export type TResponseError = {
  error: boolean
  message: string
}
export type TEstablishmentResponseSuccess = IRecruiter

export type TCreateEstablishmentBody = Pick<IRecruiter, "establishment_siret" | "establishment_raison_sociale" | "first_name" | "last_name" | "phone" | "email" | "idcc" | "origin">
export type TJob = {
  job_level_label: string
  job_duration: number
  job_type: string[]
  is_disabled_elligible: boolean
  job_count: number
  job_rythm: string
  job_start_date: string
  job_employer_description?: string
  job_description: string
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
}
export interface ICreateDelegation {
  establishmentIds: string[]
}
