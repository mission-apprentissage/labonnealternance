import { JOB_STATUS } from "./constant.service"

export interface ILbaItem {
  ideaType: string | null // type de l'item :  formation | lbb | lba | peJob | matcha
  title: string | null // pe -> intitule | lbb/lba -> enseigne | formation -> intitule_long OU intitule_court | matcha -> offres.libelle || offres.rome_appellation_label
  longTitle: string | null // formation -> intitule_long,
  id: string | null // formation -> id | matcha -> id_form
  idRco: string | null // formation -> id_formation
  idRcoFormation: string | null // formation -> id_rco_formation

  contact: ILbaItemContact | null // informations de contact. optionnel

  place: ILbaItemPlace | null // lieu principal pour l'item, lieu de formation ou lieu de l'offre ou adresse de l'entreprise

  company: ILbaItemCompany | null

  createdAt: string | null // formation -> created_at | matcha -> createdAt
  lastUpdateAt: string | null // formation -> last_update_at | matcha -> updatedAt
  url: string | null // pe -> reconstruction depuis id | lbb/lba url

  /** TODO API V2: move inside training<ILbaItemTraining> */
  cleMinistereEducatif: string | null // formation
  diplomaLevel: string | null // formation -> niveau  | matcha -> offres.niveau
  diploma: string | null // formation -> diplome
  cfd: string | null // formation -> cfd
  rncpCode: string | null // formation -> rncp_code
  rncpLabel: string | null // formation -> rncp_intitule
  rncpEligibleApprentissage: string | null // formation -> rncp_eligible_apprentissage
  period: string | null // formation -> periode
  capacity: string | null // formation -> capacite
  onisepUrl: string | null // formation -> onisep_url

  job: ILbaItemJob | null // uniquement pour pe et matcha

  romes: ILbaItemRome[] | null
  nafs: ILbaItemNaf[] | null

  training: ILbaItemTraining | null

  applicationCount: number | null // lba / matcha -> calcul en fonction du nombre de candidatures enregistrées
}

export interface ILbaItemContact {
  // informations de contact. optionnel
  email?: string | null // pe -> contact.courriel | lbb/lba -> email | formation -> email | matcha -> email
  name?: string | null // pe -> contact.nom | matcha -> prenom nom
  phone?: string | null // lbb/lba --> phone | matcha -> telephone
  info?: string | null // pe -> contact.coordonnees1+contact.coordonnees2+contact.coordonnees3
}

export interface ILbaItemPlace {
  // lieu principal pour l'item, lieu de formation ou lieu de l'offre ou adresse de l'entreprise
  distance: number | null // distance au centre de recherche en km. pe --> lieutTravail.distance recalculé par turf.js | formation --> sort[0] | lbb/lba -> distance | matcha -> sort[0]
  fullAddress: string | null // adresse postale reconstruite à partir des éléments d'adresse fournis | matcha -> adresse | formation -> lieu_formation_adresse + code_postal + localite OU etablissement_formateur_adresse + ...complement_adresse + ...code_postal + ...localite + ...cedex OU etablissement_gestionnaire_adresse + ...complement_adresse + ...localite + ...cedex
  latitude: string | null // formation -> lieu_formation_geo_coordonnees | pe -> lieuTravail.latitude | lbb/lba -> geo_coordinates | matcha -> geo_coordonnees
  longitude: string | null // formation -> lieu_formation_geo_coordonnees | pe -> lieuTravail.longitude | lbb/lba -> geo_coordinates | matcha -> geo_coordonnees
  city: string | null // pe -> lieuTravail.libelle | formation -> localite | pe -> city | lba -> city
  address: string | null // formation -> etablissement_formateur_adresse, etablissement_formateur_complement_adresse | lbb / lba -> address -> street_number + street_name | matcha -> adresse
  cedex: string | null // formation -> etablissement_formateur_cedex
  zipCode: string | null // formation -> etablissement_formateur_code_postal | pe -> lieuTravail.codePostal | lba -> zip_code
  insee: string | null // pe -> lieuTravail.commune, training -> code_commune_insee, lba -> insee_city_code
  departementNumber: string | null // formation -> num_departement
  region: string | null // formation -> region
  remoteOnly: boolean | null // formation
}

export interface ILbaItemCompany {
  name: string | null // pe -> entreprise.nom | formation -> etablissement_formateur_entreprise_raison_sociale | lbb/lba -> enseigne / raison_sociale | matcha -> enseigne > raison_sociale
  siret: string | null // lbb/lba -> siret | formation -> etablissement_formateur_siret | matcha -> siret | pe -> entreprise.siret réservé à notre front
  size?: string | null // lbb/lba -> company_size | matcha -> tranche_effectif
  logo?: string | null // pe -> entreprise.logo
  description?: string | null // pe -> entreprise.description
  socialNetwork?: string | null // lbb / lba -> social_network
  url?: string | null // lbb / lba -> website
  id: string | null // formation -> etablissement_formateur_id
  uai: string | null // formation -> etablissement_formateur_uai
  place: Partial<ILbaItemPlace> | null
  //        city,   // formation -> etablissement_formateur_localite | matcha -> entreprise_localite
  mandataire?: boolean | null // matcha -> mandataire
  creationDate?: Date | null // matcha -> date_creation_etablissement
  headquarter: ILbaItemCompanyHQ | null // uniquement pour formation
  opco?: ILbaItemOpco | null
}

export interface ILbaItemCompanyHQ {
  siret: string | null // formation -> etablissement_gestionaire_siret
  id: string | null // formation -> etablissement_gestionnaire_id
  uai: string | null // formation -> etablissement_gestionnaire_uai
  type: string | null // formation -> etablissement_gestionnaire_type
  hasConvention: string | null // formation -> etablissement_gestionnaire_conventionne
  place: Partial<ILbaItemPlace> | null
  /*        //fullAddress   // reconstruction
            //address       // formation -> etablissement_gestionnaire_adresse, etablissement_gestionnaire_complement_adresse
            //cedex         // formation -> etablissement_gestionnaire_cedex
            //zipCode       // formation -> etablissement_gestionnaire_code_postal
            //city          // formation -> etablissement_gestionnaire_localite     */
  name: string | null // formation -> etablissement_gestionnaire_entreprise_raison_sociale
}

export interface ILbaItemOpco {
  label: string | null // lba -> opco
  url: string | null // lba -> opco_url
}

export interface ILbaItemJob {
  description: string | null // pe -> description | matcha -> description
  creationDate: string | Date // pe -> dateCreation | matcha -> createdAt
  id: string | null // pe -> id | matcha -> id mongo offre
  contractType: string | null // pe -> typeContrat | matcha -> offres.type
  contractDescription?: string | null // pe -> typeContratLibelle
  duration?: string | null // pe -> dureeTravailLibelle
  jobStartDate: string | Date // matcha -> offres.date_debut_apprentissage
  romeDetails: object // matcha -> offres.rome_detail -> détail du code ROME
  rythmeAlternance: string | null // matcha -> offres.rythme_alternance
  elligibleHandicap?: boolean // matcha -> offres.is_disabled_elligible
  dureeContrat: string | null // matcha -> offres.duree_contrat
  quantiteContrat?: number | null // matcha -> offres.quantite
  status?: JOB_STATUS | null
}

export interface ILbaItemRome {
  code: string | null // pe -> romeCode | lbb/lba -> rome_codes | matcha -> offres.romes
  label?: string | null // pe -> appellationLibelle | lbb/lba -> matched_rome_label
}

export interface ILbaItemNaf {
  code?: string | null // lbb/lba -> naf_code | pe -> secteurActivite
  label: string | null // lbb/lba -> naf_label | matcha -> libelle_naf | pe -> secteurActiviteLibelle
}

export interface ILbaItemTraining {
  // alimentation partielle côté client à l'ouverture d'une formation
  description: string | null
  objectif: string | null
  sessions: ILbaItemTrainingSession[]
}

export interface ILbaItemTrainingSession {
  startTime: string | null
  endTime: string | null
  isPermanentEntry: string | null
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

  contact: ILbaItemContact | null = null

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

  job: ILbaItemJob | null = null
  romes: ILbaItemRome[] | null = null
  nafs: ILbaItemNaf[] | null = null
  training: ILbaItemTraining | null = null
  applicationCount = null
}
