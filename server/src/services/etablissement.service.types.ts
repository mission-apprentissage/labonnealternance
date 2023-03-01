export interface IApiEntreprise {
  siege_social: boolean
  siret: string
  naf: string
  libelle_naf: string
  date_mise_a_jour: number
  tranche_effectif_salarie_etablissement: ITrancheEffectifSalarieEtablissement
  date_creation_etablissement: number
  region_implantation: IImplantation
  commune_implantation: IImplantation
  pays_implantation: IImplantation
  diffusable_commercialement: boolean
  enseigne: null
  adresse: IAdresse
  etat_administratif: IEtatAdministratif
}

export interface IAdresse {
  l1: string
  l2: null
  l3: string
  l4: string
  l5: null
  l6: string
  l7: string
  numero_voie: string
  type_voie: string
  nom_voie: string
  complement_adresse: string
  code_postal: string
  localite: string
  code_insee_localite: string
  cedex: null
}

export interface IImplantation {
  code: string
  value: string
}

export interface IEtatAdministratif {
  value: string
  date_fermeture: null
}

export interface ITrancheEffectifSalarieEtablissement {
  de: number
  a: number
  code: string
  date_reference: string
  intitule: string
}

export interface IReferentiel {
  siret: string
  _meta: IMeta
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
  adresse: IAdresse
  nature: string
  numero_declaration_activite: string
  qualiopi: boolean
  uai: string
}

export interface IMeta {
  anomalies: Anomaly[]
  date_import: Date
  date_dernier_import: Date
  date_collecte: Date
  uai_probable: string
  nouveau: boolean
}

export interface Anomaly {
  key: string
  type: string
  details: string
  job: string
  sources: string[]
  date_collecte: Date
}

export interface IAdresse {
  academie: Academie
  code_insee: string
  code_postal: string
  departement: Academie
  geojson: Geojson
  label: string
  localite: string
  region: Academie
}

export interface Academie {
  code: string
  nom: string
}

export interface Geojson {
  geometry: IGeometry
  properties: IProperties
  type: string
}

export interface IGeometry {
  coordinates: number[]
  type: string
}

export interface IProperties {
  score: number
  source: string
}

export interface ICertification {
  type: string
  code: string
  label: string
  sources: string[]
  date_collecte: Date
  niveau?: string
}

export interface IContact {
  email: string
  confirmé: boolean
  sources: string[]
  date_collecte: Date
}

export interface IFormeJuridique {
  code: string
  label: string
}

export interface ILieuxDeFormation {
  code: string
  adresse?: IAdresse
  sources: string[]
  date_collecte: Date
  label?: string
}

export interface IUaiPotentiel {
  uai: string
  sources: string[]
  date_collecte: Date
}

export interface IEtablissementCatalogue {
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

export interface IGeometry {
  type: string
  coordinates: number[]
}

export interface IProperties {
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
  idcc: number
  opcoName: string
  opcoSiren: string
  searchStatus: string
  url: string
}

export interface IFilters {
  idcc: null
  siret: string
}

export interface ISIRET2IDCC {
  conventions: IConvention[]
  siret: string
}

export interface IConvention {
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
