import { IAdresseV2, IAdresseCFA, IAdresseV3 } from "../_shared/shared.types.js"
import { IJobs } from "../jobs/jobs.types.js"

interface IGlobalAdress extends IAdresseV2, IAdresseV3, IAdresseCFA {}
interface IRecruiter {
  _id: string
  establishment_id: string
  establishment_raison_sociale: string
  establishment_enseigne: string
  establishment_siret: string
  establishment_size: string
  establishment_creation_date: string
  address_detail: IGlobalAdress
  address: string
  geo_coordinates: string
  is_delegated: boolean
  cfa_delegated_siret: string
  last_name: string
  first_name: string
  phone: string
  email: string
  jobs: IJobs[]
  origin: string
  opco: string
  idcc: string
  status: string
  naf_code: string
  naf_label: string
  createdAt: Date
  updatedAt: Date
}

export { IRecruiter }
