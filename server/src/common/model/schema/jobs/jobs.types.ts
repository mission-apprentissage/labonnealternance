import { Types } from "mongoose"

interface IDelegation {
  siret_code: string
  email: string
  cfa_read_company_detail_at: Date
}

interface IJobs {
  _id: Types.ObjectId
  rome_label: string
  rome_appellation_label: string
  job_level_label: string
  job_description: string
  job_start_date: Date
  rome_code: string[]
  rome_detail: object
  job_creation_date: Date
  job_expiration_date: Date
  job_update_date: Date
  job_last_prolongation_date: Date
  job_prolongation_count: number
  job_status: string
  job_status_comment: string
  job_type: string[]
  is_multi_published: boolean
  is_delegated: boolean
  job_delegation_count: number
  delegations: IDelegation[]
  is_disabled_elligible: boolean
  job_count: number
  job_duration: string
  job_rythm: string
  custom_address: string
  custom_geo_coordinates: string
}

export { IDelegation, IJobs }
