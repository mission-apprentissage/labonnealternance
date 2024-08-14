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

interface IEtablissementCatalogueRaw {
  _id: string
  siege_social: boolean
  etablissement_siege_siret: string
  siret: string
  siren: string
  nda: string
  naf_code: string
  naf_libelle: string
  date_creation: Date
  diffusable_commercialement: boolean
  enseigne: null
  onisep_nom: null
  onisep_url: null
  onisep_code_postal: null
  adresse: string
  numero_voie: string
  type_voie: string
  nom_voie: string
  complement_adresse: string
  code_postal: string
  num_departement: string
  nom_departement: string
  localite: string
  code_insee_localite: string
  cedex: null
  date_fermeture: Date
  ferme: boolean
  region_implantation_code: string
  region_implantation_nom: string
  commune_implantation_code: string
  commune_implantation_nom: string
  num_academie: number
  nom_academie: string
  uai: string
  info_datagouv_ofs: null
  info_datagouv_ofs_info: null
  info_qualiopi_info: string
  api_entreprise_reference: boolean
  entreprise_siren: string
  entreprise_procedure_collective: boolean
  entreprise_enseigne: null
  entreprise_numero_tva_intracommunautaire: null
  entreprise_raison_sociale: string
  entreprise_nom_commercial: null
  entreprise_date_creation: Date
  entreprise_date_radiation: Date
  entreprise_naf_code: string
  entreprise_naf_libelle: string
  entreprise_date_fermeture: Date
  entreprise_ferme: boolean
  entreprise_siret_siege_social: string
  entreprise_nom: null
  entreprise_prenom: null
  formations_attachees: null
  formations_ids: any[]
  formations_uais: null
  published: boolean
  updates_history: any[]
  tags: string[]
  rco_uai: string
  rco_adresse: null
  rco_code_postal: string
  rco_code_insee_localite: string
  idcc: null
  opco_nom: null
  opco_siren: null
  created_at: Date
  last_update_at: Date
  __v: number
  entreprise_tranche_effectif_salarie: null
  etablissement_siege_id: null
  geo_coordonnees: string
  rco_geo_coordonnees: null
  uai_valide: boolean
  certifie_qualite: boolean
  date_mise_a_jour: null
  ds_id_dossier: null
  ds_questions_ask_for_certificaton_date: null
  ds_questions_declaration_code: null
  ds_questions_has_2020_training: null
  ds_questions_has_agrement_cfa: null
  ds_questions_has_ask_for_certificaton: null
  ds_questions_has_certificaton_2015: null
  ds_questions_nom: null
  ds_questions_siren: null
  ds_questions_uai: null
  entreprise_capital_social: null
  entreprise_categorie: null
  entreprise_code_effectif_entreprise: null
  entreprise_forme_juridique: string
  entreprise_forme_juridique_code: string
  formations_n3: null
  formations_n4: null
  formations_n5: null
  formations_n6: null
  formations_n7: null
  pays_implantation_code: string
  pays_implantation_nom: string
  tranche_effectif_salarie: null
  uais_potentiels: null
  update_error: null
}

export type IEtablissementCatalogue = Jsonify<IEtablissementCatalogueRaw>

export interface IAPIAdresse {
  type: string
  version: string
  features: IFeature[]
  attribution: string
  licence: string
  query: string
  limit: number
}

interface IFeature {
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
