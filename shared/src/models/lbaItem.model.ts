import type { Jsonify } from "type-fest"

import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "../constants/lbaitem.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { ZJobType } from "./job.model.js"
import { ZJobsPartnersOfferPrivate } from "./jobsPartners.model.js"
import { ZReferentielRomeForJob } from "./rome.model.js"

const ZLbaItemPlace = z
  .object({
    distance: z
      .number()
      
      .nullable(), // distance au centre de recherche en km. pe --> lieutTravail.distance recalculé par turf.js | formation --> sort[0] | lbb/lba -> distance | matcha -> sort[0] | partner -> distance
    fullAddress: z
      .string()
      
      .nullish(), // adresse postale reconstruite à partir des éléments d'adresse fournis | matcha -> adresse | formation -> lieu_formation_adresse + code_postal + localite OU etablissement_formateur_adresse + ...complement_adresse + ...code_postal + ...localite + ...cedex OU etablissement_gestionnaire_adresse + ...complement_adresse + ...localite + ...cedex | partner -> workplace_address_label
    latitude: z
      .number()
      .nullable()
      
      .optional(), // formation -> lieu_formation_geo_coordonnees | pe -> lieuTravail.latitude | lbb/lba -> geo_coordinates | matcha -> geo_coordonnees
    longitude: z
      .number()
      .nullable()
      
      .optional(), // formation -> lieu_formation_geo_coordonnees | pe -> lieuTravail.longitude | lbb/lba -> geo_coordinates | matcha -> geo_coordonnees
    numberAndStreet: z.string().nullish(),
    city: z
      .string()
      
      .nullish(), // pe -> lieuTravail.libelle | formation -> localite | pe -> city | lba -> city | partner -> workplace_address_city
    address: z.string().nullish(), // formation -> etablissement_formateur_adresse, etablissement_formateur_complement_adresse | lbb / lba -> address -> street_number + street_name | matcha -> adresse | partner -> workplace_address_street_label
    cedex: z.string().nullish(), // formation -> etablissement_formateur_cedex
    zipCode: z
      .string()
      
      .nullish(), // formation -> etablissement_formateur_code_postal | pe -> lieuTravail.codePostal | lba -> zip_code | partner -> workplace_address_zipcode
    insee: z
      .string()
      
      .nullish(), // pe -> lieuTravail.commune, training -> code_commune_insee, lba -> insee_city_code
    departementNumber: z
      .string()
      
      .nullish(), // formation -> num_departement
    region: z
      .string()
      
      .nullish(), // formation -> region
    remoteOnly: z.boolean().nullish(), // formation | partner -> contract_remote
  })
  .strict()
  

export type ILbaItemPlace = z.output<typeof ZLbaItemPlace>

const ZLbaItemRome = z
  .object({
    code: z
      .string()
      
      .nullable(), // pe -> romeCode | lbb/lba -> rome_codes | matcha -> offres.romes
    label: z
      .string()
      
      .nullish(), // pe -> appellationLibelle | lbb/lba -> matched_rome_label
  })
  .strict()
  

export type ILbaItemRome = z.output<typeof ZLbaItemRome>

const ZLbaItemNaf = z
  .object({
    code: z.string().nullish(), // lbb/lba -> naf_code | pe -> secteurActivite
    label: z.string().nullish(), // lbb/lba -> naf_label | matcha -> libelle_naf | pe -> secteurActiviteLibelle
  })
  .strict()

export type ILbaItemNaf = z.output<typeof ZLbaItemNaf>

const ZLbaItemContact = z
  .object({
    // informations de contact. optionnel
    email: z
      .string()
      //.email()   TODO: actuellement string chiffrée qui n'a pas la shape d'une email
      
      .nullish(), // pe -> contact.courriel | lbb/lba -> email | formation -> email | matcha -> email
    iv: z.string().nullish(),
    hasEmail: z.boolean(),
    name: z
      .string()
      
      .nullish(), // pe -> contact.nom | matcha -> prenom nom
    phone: z
      .string()
      
      .nullish(), // lbb/lba --> phone | matcha -> telephone | pe -> contact.telephone
    info: z
      .string()
      
      .nullish(), // pe -> contact.coordonnees1+contact.coordonnees2+contact.coordonnees3
    url: z.string().nullish(), // pe -> contact.urlPostulation
  })
  .strict()
  

export type ILbaItemContact = z.output<typeof ZLbaItemContact>

const ZLbaItemCompanyHQ = z
  .object({
    siret: extensions.siret.nullable(), // formation -> etablissement_gestionaire_siret
    id: z.string().nullish(), // formation -> etablissement_gestionnaire_id
    uai: z.string().nullish(), // formation -> etablissement_gestionnaire_uai
    type: z.string().nullish(), // formation -> etablissement_gestionnaire_type
    hasConvention: z.string().nullish(), // formation -> etablissement_gestionnaire_conventionne
    place: ZLbaItemPlace.partial().nullish(),
    name: z
      .string()
      
      .nullish(), // formation -> etablissement_gestionnaire_entreprise_raison_sociale
  })
  .strict()

export type ILbaItemCompanyHQ = z.output<typeof ZLbaItemCompanyHQ>

const ZLbaItemOpco = z
  .object({
    label: z.string().nullable(), // lba -> opco
    url: z.string().nullable(), // lba -> opco_url
  })
  .strict()

export type ILbaItemOpco = z.output<typeof ZLbaItemOpco>

const ZLbaItemCompany = z
  .object({
    name: z
      .string()
      
      .nullish(), // pe -> entreprise.nom | formation -> etablissement_formateur_entreprise_raison_sociale | lbb/lba -> enseigne / raison_sociale | matcha -> enseigne > raison_sociale
    siret: extensions.siret.nullish(), // lbb/lba -> siret | formation -> etablissement_formateur_siret | matcha -> siret | pe -> entreprise.siret réservé à notre front
    size: z
      .string()
      
      .nullish(), // lbb/lba -> company_size | matcha -> tranche_effectif
    logo: z.string().nullish(), // pe -> entreprise.logo
    description: z.string().nullish(), // pe -> entreprise.description
    socialNetwork: z.string().nullish(), // lbb / lba -> social_network
    url: z.string().nullish(), // lbb / lba -> website
    id: z.string().nullish(), // formation -> etablissement_formateur_id
    uai: z.string().nullish(), // formation -> etablissement_formateur_uai
    place: ZLbaItemPlace.partial().nullish(),
    mandataire: z.boolean().nullish(), // matcha -> mandataire
    creationDate: z.date().nullish(), // matcha -> date_creation_etablissement
    headquarter: ZLbaItemCompanyHQ.nullish(), // uniquement pour formation
    opco: ZLbaItemOpco.nullish(), // partner -> workplace_opco
    elligibleHandicap: z.boolean().nullish(),
  })
  .strict()
  

export type ILbaItemCompany = z.output<typeof ZLbaItemCompany>

const ZLbaItemJob = z
  .object({
    description: z.string().nullish(), // pe -> description | matcha -> description | partner -> offer_description
    employeurDescription: z.string().nullish(), // matcha -> job.job_employer_description | partner -> workplace_description
    creationDate: z.date().nullable(), // pe -> dateCreation | matcha -> createdAt | partner -> offer_creation
    id: z.string().nullish(), // pe -> id | matcha -> id mongo offre | partner -> partner_id
    contractType: z.string().nullish(), // pe -> typeContrat | matcha -> offres.type
    contractDescription: z.string().nullish(), // pe -> typeContratLibelle
    duration: z.string().nullish(), // pe -> dureeTravailLibelle | partner -> contract_duration
    jobStartDate: z.date().nullish(), // matcha -> offres.date_debut_apprentissage | partner -> contract_start
    jobExpirationDate: z.date().nullish(), // partner -> offer_expiration
    romeDetails: ZReferentielRomeForJob.nullish(), // matcha -> offres.rome_detail -> détail du code ROME
    rythmeAlternance: z.string().nullish(), // matcha -> offres.rythme_alternance
    elligibleHandicap: z.boolean().nullish(), // matcha -> offres.is_disabled_elligible
    dureeContrat: z.string().nullish(), // matcha -> offres.duree_contrat | partner -> contract_duration
    quantiteContrat: z.number().nullish(), // matcha -> offres.quantite | partner -> offer_opening_count
    status: z.enum(["Active", "Pourvue", "Annulée", "En attente"]).nullish(),
    type: ZJobType.nullish(), // partner -> contract_type
    partner_label: z.string().nullish(), // partner -> partner_label
    origin: z.string().nullish(), // partner -> offer_origin
    offer_desired_skills: z.array(z.string()).nullish(), // partner -> offer_desired_skills,
    offer_to_be_acquired_skills: z.array(z.string()).nullish(), // partner -> offer_to_be_acquired_skills,
    offer_to_be_acquired_knowledge: z.array(z.string()).nullish(),
    offer_access_conditions: z.array(z.string()).nullish(), // partner -> offer_access_conditions
    contract_rythm: z.string().nullish(),
    isCfaEntreprise: z.boolean().nullish(), // issu de la liste des cfa d'entreprise cf shared/src/services/isCfaEntreprise.ts
    to_applicant_questions: z.array(z.string()).nullish().describe("Questions posées par le recruteur pour le candidat"),
  })
  .strict()
   // uniquement pour pe et matcha

export type ILbaItemJob = z.output<typeof ZLbaItemJob>

const ZLbaItemTrainingSession = z
  .object({
    startDate: z.date().nullish(),
    endDate: z.date().nullish(),
    isPermanentEntry: z.boolean(),
  })
  .strict()
  

export type ILbaItemTrainingSession = z.output<typeof ZLbaItemTrainingSession>

const ZLbaItemTraining = z
  .object({
    description: z.string().nullable(),
    objectif: z.string().nullable(),
    sessions: z.array(ZLbaItemTrainingSession).nullish(),
    duration: z.number().nullable(),
  })
  .strict()
  

export type ILbaItemTraining = z.output<typeof ZLbaItemTraining>

const ZLbaItemTraining2 = z
  .object({
    description: z.string().nullish(),
    objectif: z.string().nullish(),
    sessions: z.array(ZLbaItemTrainingSession).nullish(),
    duration: z.number().nullish(),
    title: z.string().nullish(), // formation -> intitule_long OU intitule_court
    idRco: z.string().nullish(), // formation -> id_formation
    cleMinistereEducatif: z.string().nullish(), // formation
    target_diploma_level: z
      .string()
      
      .nullish(), // formation -> niveau
    diploma: z
      .string()
      
      .nullish(), // formation -> diplome
    cfd: z
      .string()
      
      .nullish(), // formation -> cfd
    rncpCode: z
      .string()
      
      .nullish(), // formation -> rncp_code
    rncpLabel: z
      .string()
      
      .nullish(), // formation -> rncp_intitule
    onisepUrl: z
      .string()
      
      .nullish(), // formation -> onisep_url
    romes: z.array(ZLbaItemRome).nullish(),
    elligibleForAppointment: z.boolean().describe("Indique si la formation est éligible pour la prise de rendez-vous").nullish(),
  })
  .strict()
  

export type ILbaItemTraining2 = Jsonify<z.output<typeof ZLbaItemTraining2>>

export const ZLbaItemFormation = z
  .object({
    ideaType: z.literal(LBA_ITEM_TYPE_OLD.FORMATION),
    title: z.string().nullish(), // formation -> intitule_long OU intitule_court
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),

    longTitle: z.string().nullish(), // formation -> intitule_long,
    id: z.string().nullable(), // formation -> id
    idRco: z.string().nullish(), // formation -> id_formation
    idRcoFormation: z.string().nullish(), // formation -> id_rco_formation

    /** TODO API V2: move inside training<ILbaItemTraining> */
    cleMinistereEducatif: z.string().nullish(), // formation
    target_diploma_level: z
      .string()
      
      .nullish(), // formation -> niveau
    diploma: z
      .string()
      
      .nullish(), // formation -> diplome
    cfd: z
      .string()
      
      .nullish(), // formation -> cfd
    rncpCode: z
      .string()
      
      .nullish(), // formation -> rncp_code
    rncpLabel: z
      .string()
      
      .nullish(), // formation -> rncp_intitule
    rncpEligibleApprentissage: z
      .boolean()
      
      .nullish(), // formation -> rncp_eligible_apprentissage
    period: z.string().nullish(), // formation -> periode
    capacity: z
      .string()
      
      .nullish(), // formation -> capacite
    onisepUrl: z
      .string()
      
      .nullish(), // formation -> onisep_url

    romes: z.array(ZLbaItemRome).nullish(),

    training: ZLbaItemTraining.nullish(),

    rdvContext: z.any().nullish(),
  })
  

export type ILbaItemFormation = z.output<typeof ZLbaItemFormation>
export type ILbaItemFormationJson = Jsonify<ILbaItemFormation>

export const ZLbaItemFormation2 = z
  .object({
    type: z.literal(LBA_ITEM_TYPE.FORMATION),
    id: z.string().describe("clé ministere educatif - necessaire pour le front"),
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.omit({
      id: true,
      url: true,
      socialNetwork: true,
    }).nullable(),
    training: ZLbaItemTraining2.nullish(),
  })
  .strict()
  

export type ILbaItemFormation2 = z.output<typeof ZLbaItemFormation2>
export type ILbaItemFormation2Json = Jsonify<ILbaItemFormation2>

export const ZLbaItemLbaJob = z
  .object({
    ideaType: z.enum([LBA_ITEM_TYPE_OLD.MATCHA, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]),
    title: z.string().nullish(), // matcha -> offres.libelle || offres.rome_appellation_label
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),
    id: z.string().nullable(), // matcha -> id_form
    target_diploma_level: z
      .string()
      
      .nullish(), // matcha -> offres.niveau
    job: ZLbaItemJob.nullish(),
    romes: z.array(ZLbaItemRome).nullish(),
    nafs: z.array(ZLbaItemNaf).nullish(),
    applicationCount: z.number(), // calcul en fonction du nombre de candidatures enregistrées
    token: z.string(),
    recipient_id: z.string().describe("Identifiant personnalisé (ID mongoDB préfixé du nom de la collection) envoyé au server pour la candidature"),
  })
  .strict()
  

export type ILbaItemLbaJob = z.output<typeof ZLbaItemLbaJob>
export type ILbaItemLbaJobJson = Jsonify<z.output<typeof ZLbaItemLbaJob>>
export const ZLbaItemLbaJobReturnedByAPI = z.object({ matchas: z.array(ZLbaItemLbaJob) })
export type ILbaItemLbaJobReturnedByAPI = Jsonify<z.output<typeof ZLbaItemLbaJobReturnedByAPI>>

export const ZLbaItemPartnerJob = z
  .object({
    ideaType: z.enum([LBA_ITEM_TYPE_OLD.PARTNER_JOB, LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]),
    title: z.string(), // partnerJob -> offer_title
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),
    id: z.string(), // partnerJob -> _id
    target_diploma_level: z // partnerJob -> offer_target_diploma
      .string()
      
      .nullish(), // matcha -> offres.niveau
    job: ZLbaItemJob,
    romes: z.array(ZLbaItemRome).nullish(),
    nafs: z.array(ZLbaItemNaf).nullish(),
    token: z.string(),
    recipient_id: z.string().describe("Identifiant personnalisé (ID mongoDB préfixé du nom de la collection) envoyé au server pour la candidature"),
    applicationCount: z.number().nullish(),
  })
  .strict()
  

export type ILbaItemPartnerJob = z.output<typeof ZLbaItemPartnerJob>
export type ILbaItemPartnerJobJson = Jsonify<ILbaItemPartnerJob>
export const ZLbaItemPartnerJobReturnedByAPI = z.object({ partnerJobs: z.array(ZLbaItemPartnerJob) })
export type ILbaItemPartnerJobReturnedByAPI = Jsonify<z.output<typeof ZLbaItemPartnerJobReturnedByAPI>>

export const ZLbaItemLbaCompany = z
  .object({
    ideaType: z.enum([LBA_ITEM_TYPE_OLD.LBA, LBA_ITEM_TYPE.RECRUTEURS_LBA]),
    status: ZJobsPartnersOfferPrivate.shape.offer_status,
    // ideaType: z.literal(LBA_ITEM_TYPE.RECRUTEURS_LBA),
    id: z.string().nullable(),
    title: z.string().nullish(), // lbb/lba -> enseigne
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),
    url: z.string().nullish(), // partner -> workplace_website
    nafs: z.array(ZLbaItemNaf).nullish(),
    applicationCount: z.number(), // calcul en fonction du nombre de candidatures enregistrées
    token: z.string().nullish(), // KBA 2024_05_20 : for API V2 only, remove nullish when fully migrated
    recipient_id: z.string().describe("Identifiant personnalisé (ID mongoDB préfixé du nom de la collection) envoyé au server pour la candidature"),
  })
  .strict()
  

export type ILbaItemLbaCompany = z.output<typeof ZLbaItemLbaCompany> & { ideaType: LBA_ITEM_TYPE_OLD.LBA | LBA_ITEM_TYPE.RECRUTEURS_LBA; id: string }
export type ILbaItemLbaCompanyJson = Jsonify<ILbaItemLbaCompany>
export const ZLbaItemLbaCompanyReturnedByAPI = z.object({ lbaCompanies: z.array(ZLbaItemLbaCompany) })
export type ILbaItemLbaCompanyReturnedByAPI = Jsonify<z.output<typeof ZLbaItemLbaCompanyReturnedByAPI>>

export const ZLbaItemFtJob = z
  .object({
    ideaType: z.enum([LBA_ITEM_TYPE_OLD.PEJOB, LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]),
    id: z.string().nullable(),
    title: z.string().nullish(), // pe -> intitule
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),
    url: z.string().nullish(), // pe -> reconstruction depuis id
    job: ZLbaItemJob.nullish(),
    romes: z.array(ZLbaItemRome).nullish(),
    nafs: z.array(ZLbaItemNaf).nullish(),
  })
  .strict()
  

export type ILbaItemFtJob = z.output<typeof ZLbaItemFtJob>
export type ILbaItemFtJobJson = Jsonify<ILbaItemFtJob>
export const ZLbaItemFtJobReturnedByAPI = z.object({ peJobs: z.array(ZLbaItemFtJob) })
export type ILbaItemFtJobReturnedByAPI = Jsonify<z.output<typeof ZLbaItemFtJobReturnedByAPI>>

export const ZLbaItemFormationResult = z
  .object({
    results: z.array(ZLbaItemFormation),
  })
  .strict()
  
export type ILbaItemFormationResult = Jsonify<z.output<typeof ZLbaItemFormationResult>>

export type ILbaItemJobsGlobal = ILbaItemLbaCompanyJson | ILbaItemLbaJobJson | ILbaItemPartnerJobJson
