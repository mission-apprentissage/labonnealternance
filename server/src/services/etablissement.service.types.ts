import { IAdresseCFA, IAdresseV2, IAdresseV3 } from "../common/model/schema/_shared/shared.types.js"

export interface IAPIEtablissement {
  data: IEtablissementGouv
  links: Links
  meta: Meta
}

export interface IEtablissementGouv {
  siret: string
  siege_social: boolean
  etat_administratif: string
  date_fermeture: any
  enseigne: any
  activite_principale: ActivitePrincipale
  tranche_effectif_salarie: TrancheEffectifSalarie
  diffusable_commercialement: boolean
  status_diffusion: string
  date_creation: number
  unite_legale: UniteLegale
  adresse: IAdresseV2V3
}

interface IAdresseV2V3 extends IAdresseV2, IAdresseV3 {}

interface ActivitePrincipale {
  code: string
  nomenclature: string
  libelle: string
}

interface TrancheEffectifSalarie {
  de: any
  a: any
  code: string
  date_reference: any
  intitule: string
}

interface UniteLegale {
  siren: string
  rna: any
  siret_siege_social: string
  type: string
  personne_morale_attributs: PersonneMoraleAttributs
  personne_physique_attributs: PersonnePhysiqueAttributs
  categorie_entreprise: string
  status_diffusion: string
  diffusable_commercialement: boolean
  forme_juridique: FormeJuridique
  activite_principale: ActivitePrincipale2
  tranche_effectif_salarie: TrancheEffectifSalarie2
  economie_sociale_et_solidaire: any
  date_creation: number
  etat_administratif: string
}

interface PersonneMoraleAttributs {
  raison_sociale: string
  sigle: any
}

interface PersonnePhysiqueAttributs {
  pseudonyme: any
  prenom_usuel: any
  prenom_1: any
  prenom_2: any
  prenom_3: any
  prenom_4: any
  nom_usage: any
  nom_naissance: any
  sexe: any
}

interface FormeJuridique {
  code: string
  libelle: string
}

interface ActivitePrincipale2 {
  code: string
  nomenclature: string
  libelle: string
}

interface TrancheEffectifSalarie2 {
  de: any
  a: any
  code: string
  date_reference: any
  intitule: string
}

interface Links {
  unite_legale: string
}

interface Meta {
  date_derniere_mise_a_jour: number
  redirect_from_siret: any
}

// export interface IAPIEtablissement {
//   etablissement: IEtablissementGouv
//   gateway_error: boolean
// }

// export interface IEtablissementGouv {
//   siege_social: boolean
//   siret: string
//   naf: string
//   libelle_naf: string
//   date_mise_a_jour: number
//   tranche_effectif_salarie_etablissement: ITrancheEffectifSalarieEtablissement
//   date_creation_etablissement: number
//   region_implantation: IImplantation
//   commune_implantation: IImplantation
//   pays_implantation: IImplantation
//   diffusable_commercialement: boolean
//   enseigne: null
//   adresse: IAdresse
//   etat_administratif: IEtatAdministratif
// }

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
  adresse: IAdresseCFA
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
  adresse?: IAdresseCFA
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
