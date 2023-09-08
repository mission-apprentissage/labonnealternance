import { JOB_STATUS } from "../../../../services/constant.service.js"

interface IDelegation {
  siret_code: string
  email: string
  cfa_read_company_detail_at: Date | string
}

interface IJobs {
  _id: string
  rome_label: string
  rome_appellation_label: string
  job_level_label?: string
  job_description?: string
  job_employer_description?: string
  job_start_date?: Date | string
  rome_code: string[]
  rome_detail: object
  job_creation_date: Date | string
  job_expiration_date?: Date | string
  job_update_date: Date | string
  job_last_prolongation_date: Date | string
  job_prolongation_count: number
  job_status?: JOB_STATUS
  job_status_comment: string
  job_type?: string[]
  is_multi_published: boolean
  is_delegated: boolean
  job_delegation_count: number
  delegations: IDelegation[]
  is_disabled_elligible: boolean
  job_count?: number
  job_duration?: number
  job_rythm?: string
  custom_address: string
  custom_geo_coordinates: string
  stats_detail_view?: number
  stats_search_view?: number
}

export { IDelegation, IJobs }
