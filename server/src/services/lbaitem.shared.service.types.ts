export interface ILbaItem {
  ideaType: string // type de l'item :  formation | lbb | lba | peJob | matcha
  title: string // pe -> intitule | lbb/lba -> enseigne | formation -> intitule_long OU intitule_court | matcha -> offres.libelle || offres.rome_appellation_label
  longTitle: string // formation -> intitule_long,
  id: string // formation -> id | matcha -> id_form
  idRco: string // formation -> id_formation
  idRcoFormation: string // formation -> id_rco_formation

  contact: ILbaItemContact // informations de contact. optionnel

  place: ILbaItemPlace // lieu principal pour l'item, lieu de formation ou lieu de l'offre ou adresse de l'entreprise

  company: ILbaItemCompany

  createdAt: string // formation -> created_at | matcha -> createdAt
  lastUpdateAt: string // formation -> last_update_at | matcha -> updatedAt
  url: string // pe -> reconstruction depuis id | lbb/lba url

  /** TODO API V2: move inside training<ILbaItemTraining> */
  cleMinistereEducatif: string // formation
  diplomaLevel: string // formation -> niveau  | matcha -> offres.niveau
  diploma: string // formation -> diplome
  cfd: string // formation -> cfd
  rncpCode: string // formation -> rncp_code
  rncpLabel: string // formation -> rncp_intitule
  rncpEligibleApprentissage: string // formation -> rncp_eligible_apprentissage
  period: string // formation -> periode
  capacity: string // formation -> capacite
  onisepUrl: string // formation -> onisep_url

  job: ILbaItemJob // uniquement pour pe et matcha

  romes: ILbaItemRome[]
  nafs: ILbaItemNaf[]

  training: ILbaItemTraining

  applicationCount: number // lba / matcha -> calcul en fonction du nombre de candidatures enregistrées
}

export interface ILbaItemContact {
  // informations de contact. optionnel
  email?: string // pe -> contact.courriel | lbb/lba -> email | formation -> email | matcha -> email
  name?: string // pe -> contact.nom | matcha -> prenom nom
  phone?: string // lbb/lba --> phone | matcha -> telephone
  info?: string // pe -> contact.coordonnees1+contact.coordonnees2+contact.coordonnees3
}

export interface ILbaItemPlace {
  // lieu principal pour l'item, lieu de formation ou lieu de l'offre ou adresse de l'entreprise
  distance: number // distance au centre de recherche en km. pe --> lieutTravail.distance recalculé par turf.js | formation --> sort[0] | lbb/lba -> distance | matcha -> sort[0]
  fullAddress: string // adresse postale reconstruite à partir des éléments d'adresse fournis | matcha -> adresse | formation -> lieu_formation_adresse + code_postal + localite OU etablissement_formateur_adresse + ...complement_adresse + ...code_postal + ...localite + ...cedex OU etablissement_gestionnaire_adresse + ...complement_adresse + ...localite + ...cedex
  latitude: string // formation -> lieu_formation_geo_coordonnees | pe -> lieuTravail.latitude | lbb/lba -> geo_coordinates | matcha -> geo_coordonnees
  longitude: string // formation -> lieu_formation_geo_coordonnees | pe -> lieuTravail.longitude | lbb/lba -> geo_coordinates | matcha -> geo_coordonnees
  city: string // pe -> lieuTravail.libelle | formation -> localite | pe -> city | lba -> city
  address: string // formation -> etablissement_formateur_adresse, etablissement_formateur_complement_adresse | lbb / lba -> address -> street_number + street_name | matcha -> adresse
  cedex: string // formation -> etablissement_formateur_cedex
  zipCode: string // formation -> etablissement_formateur_code_postal | pe -> lieuTravail.codePostal | lba -> zip_code
  insee: string // pe -> lieuTravail.commune, training -> code_commune_insee, lba -> insee_city_code
  departementNumber: string // formation -> num_departement
  region: string // formation -> region
  remoteOnly: boolean // formation
}

export interface ILbaItemCompany {
  name: string // pe -> entreprise.nom | formation -> etablissement_formateur_entreprise_raison_sociale | lbb/lba -> enseigne / raison_sociale | matcha -> enseigne > raison_sociale
  siret: string // lbb/lba -> siret | formation -> etablissement_formateur_siret | matcha -> siret | pe -> entreprise.siret réservé à notre front
  size?: string // lbb/lba -> company_size | matcha -> tranche_effectif
  logo?: string // pe -> entreprise.logo
  description?: string // pe -> entreprise.description
  socialNetwork?: string // lbb / lba -> social_network
  url?: string // lbb / lba -> website
  id: string // formation -> etablissement_formateur_id
  uai: string // formation -> etablissement_formateur_uai
  place: Partial<ILbaItemPlace>
  //        city,   // formation -> etablissement_formateur_localite | matcha -> entreprise_localite
  mandataire?: boolean // matcha -> mandataire
  creationDate?: Date // matcha -> date_creation_etablissement
  headquarter: ILbaItemCompanyHQ // uniquement pour formation
  opco?: ILbaItemOpco
}

export interface ILbaItemCompanyHQ {
  siret: string // formation -> etablissement_gestionaire_siret
  id: string // formation -> etablissement_gestionnaire_id
  uai: string // formation -> etablissement_gestionnaire_uai
  type: string // formation -> etablissement_gestionnaire_type
  hasConvention: string // formation -> etablissement_gestionnaire_conventionne
  place: Partial<ILbaItemPlace>
  /*        //fullAddress   // reconstruction
            //address       // formation -> etablissement_gestionnaire_adresse, etablissement_gestionnaire_complement_adresse
            //cedex         // formation -> etablissement_gestionnaire_cedex
            //zipCode       // formation -> etablissement_gestionnaire_code_postal
            //city          // formation -> etablissement_gestionnaire_localite     */
  name: string // formation -> etablissement_gestionnaire_entreprise_raison_sociale
}

export interface ILbaItemOpco {
  label: string // lba -> opco
  url: string // lba -> opco_url
}

export interface ILbaItemJob {
  description: string // pe -> description | matcha -> description
  creationDate: string | Date // pe -> dateCreation | matcha -> createdAt
  id: string // pe -> id | matcha -> id mongo offre
  contractType: string // pe -> typeContrat | matcha -> offres.type
  contractDescription?: string // pe -> typeContratLibelle
  duration?: string // pe -> dureeTravailLibelle
  jobStartDate: string | Date // matcha -> offres.date_debut_apprentissage
  romeDetails: object // matcha -> offres.rome_detail -> détail du code ROME
  rythmeAlternance: string // matcha -> offres.rythme_alternance
  elligibleHandicap?: boolean // matcha -> offres.is_disabled_elligible
  dureeContrat: string // matcha -> offres.duree_contrat
  quantiteContrat?: number // matcha -> offres.quantite
}

export interface ILbaItemRome {
  code: string // pe -> romeCode | lbb/lba -> rome_codes | matcha -> offres.romes
  label?: string // pe -> appellationLibelle | lbb/lba -> matched_rome_label
}

export interface ILbaItemNaf {
  code?: string // lbb/lba -> naf_code | pe -> secteurActivite
  label: string // lbb/lba -> naf_label | matcha -> libelle_naf | pe -> secteurActiviteLibelle
}

export interface ILbaItemTraining {
  // alimentation partielle côté client à l'ouverture d'une formation
  description: string
  objectif: string
  sessions: ILbaItemTrainingSession[]
}

export interface ILbaItemTrainingSession {
  startTime: string
  endTime: string
  isPermanentEntry: string
}

export class LbaItem implements ILbaItem {
  constructor(type) {
    this.ideaType = type
  }

  ideaType = null
  title = null
  longTitle = null
  id = null
  idRco = null
  idRcoFormation = null

  contact: ILbaItemContact = null

  place: ILbaItemPlace = {
    distance: null,
    fullAddress: null,
    latitude: null,
    longitude: null,
    city: null,
    address: null,
    cedex: null,
    zipCode: null,
    insee: null,
    departementNumber: null,
    region: null,
    remoteOnly: null,
  }

  company: ILbaItemCompany = {
    name: null,
    siret: null,
    size: null,
    logo: null,
    description: null,
    socialNetwork: null,
    url: null,
    id: null,
    uai: null,
    place: null,
    mandataire: null,
    creationDate: null,
    headquarter: null,
    opco: null,
  }

  diplomaLevel = null
  diploma = null
  cleMinistereEducatif = null
  cfd = null
  rncpCode = null
  rncpLabel = null
  rncpEligibleApprentissage = null
  period = null
  capacity = null
  createdAt = null
  lastUpdateAt = null
  onisepUrl = null
  url = null

  job: ILbaItemJob = null
  romes: ILbaItemRome[] = null
  nafs: ILbaItemNaf[] = null
  training: ILbaItemTraining = null
  applicationCount = null
}
