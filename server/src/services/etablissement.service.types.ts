import { IAdresseCFA, IRecruiter, IUserRecruteur } from "shared"
import { Jsonify } from "type-fest"

export interface IFormatAPIReferentiel
  extends Pick<IUserRecruteur, "establishment_raison_sociale" | "establishment_siret" | "is_qualiopi" | "address_detail" | "geo_coordinates" | "address"> {
  establishment_state: string
  contacts: IContact[]
}
export interface IFormatAPIEntreprise
  extends Pick<
    IRecruiter,
    | "establishment_enseigne"
    | "establishment_siret"
    | "establishment_raison_sociale"
    | "address_detail"
    | "address"
    | "naf_code"
    | "naf_label"
    | "establishment_size"
    | "establishment_creation_date"
  > {
  establishment_state: string
  contacts: object[]
  qualiopi?: boolean
  geo_coordinates?: string
}

interface IReferentielRaw {
  siret: string
  _meta: IMetaReferentiel
  certifications: ICertification[]
  contacts: IContact[]
  diplomes: ICertification[]
  lieux_de_formation: ILieuxDeFormation[]
  referentiels: string[]
  relations: any[]
  reseaux: ILieuxDeFormation[]
  uai_potentiels: IUaiPotentiel[]
  etat_administratif: string
  forme_juridique: IFormeJuridique
  raison_sociale: string
  siege_social: boolean
  adresse: IAdresseCFA
  nature: string
  numero_declaration_activite: string
  qualiopi?: boolean
  uai: string
}

export type IReferentiel = Jsonify<IReferentielRaw>

interface IMetaReferentiel {
  anomalies: Anomaly[]
  date_import: Date
  date_dernier_import: Date
  date_collecte: Date
  uai_probable: string
  nouveau: boolean
}

interface Anomaly {
  key: string
  type: string
  details: string
  job: string
  sources: string[]
  date_collecte: Date
}

interface ICertification {
  type: string
  code: string
  label: string
  sources: string[]
  date_collecte: Date
  niveau?: string
}

interface IContact {
  email: string
  confirmé: boolean
  sources: string[]
  date_collecte: Date
}

interface IFormeJuridique {
  code: string
  libelle: string
}

interface ILieuxDeFormation {
  code: string
  adresse?: IAdresseCFA
  sources: string[]
  date_collecte: Date
  label?: string
}

interface IUaiPotentiel {
  uai: string
  sources: string[]
  date_collecte: Date
}
export interface IAPIAdresse {
  type: string
  version: string
  features: IFeature[]
  attribution: string
  licence: string
  query: string
  limit: number
}

export interface IFeature {
  type: string
  geometry: IGeometry
  properties: IProperties
}

interface IGeometry {
  type: string
  coordinates: number[]
}

interface IProperties {
  label: string
  score: number
  housenumber: string
  id: string
  type: string
  name: string
  postcode: string
  citycode: string
  x: number
  y: number
  city: string
  context: string
  importance: number
  street: string
}

export interface ICFADock {
  filterNAFCode: string
  filterNAFType: string
  filters: IFilters
  idcc: number | null
  opcoName: string
  opcoSiren: string
  searchStatus: string
  url: string
}

interface IFilters {
  idcc: null
  siret: string
}

export interface ISIRET2IDCC {
  conventions?: IConvention[]
  siret: string
}

interface IConvention {
  active: boolean
  date_publi?: Date
  effectif?: number
  etat?: string
  id: string
  mtime?: number
  nature: string
  num: number
  shortTitle: string
  texte_de_base?: string
  title: string
  url: string
}
