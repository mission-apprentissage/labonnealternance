import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD } from "shared/constants/lbaitem"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { ZJobType } from "./job.model"
import { ZReferentielRomeForJob } from "./rome.model"

const ZLbaItemPlace = z
  .object({
    distance: z
      .number()
      .openapi({
        example: 3.5,
        description: "La distance du lieu par rapport au centre de recherche en kilomètres",
      })
      .nullable(), // distance au centre de recherche en km. pe --> lieutTravail.distance recalculé par turf.js | formation --> sort[0] | lbb/lba -> distance | matcha -> sort[0] | partner -> distance
    fullAddress: z
      .string()
      .openapi({
        example: "4 RUE DES ROSIERS PARIS 4 75004",
        description: "L'adresse postale complète du lieu",
      })
      .nullish(), // adresse postale reconstruite à partir des éléments d'adresse fournis | matcha -> adresse | formation -> lieu_formation_adresse + code_postal + localite OU etablissement_formateur_adresse + ...complement_adresse + ...code_postal + ...localite + ...cedex OU etablissement_gestionnaire_adresse + ...complement_adresse + ...localite + ...cedex | partner -> workplace_address_label
    latitude: z
      .number()
      .nullable()
      .openapi({
        example: 48.845,
        description: "La latitude du lieu",
      })
      .optional(), // formation -> lieu_formation_geo_coordonnees | pe -> lieuTravail.latitude | lbb/lba -> geo_coordinates | matcha -> geo_coordonnees
    longitude: z
      .number()
      .nullable()
      .openapi({
        example: 2.3752,
        description: "La longitude du lieu",
      })
      .optional(), // formation -> lieu_formation_geo_coordonnees | pe -> lieuTravail.longitude | lbb/lba -> geo_coordinates | matcha -> geo_coordonnees
    numberAndStreet: z.string().nullish().openapi({
      example: "3, rue du loup",
      description: "Numéro de rue et nom de rue",
    }),
    city: z
      .string()
      .openapi({
        example: "PARIS 4",
        description: "La ville",
      })
      .nullish(), // pe -> lieuTravail.libelle | formation -> localite | pe -> city | lba -> city | partner -> workplace_address_city
    address: z.string().nullish().openapi({
      example: "4 RUE DES ROSIERS",
      description: "L'adresse du lieu",
    }), // formation -> etablissement_formateur_adresse, etablissement_formateur_complement_adresse | lbb / lba -> address -> street_number + street_name | matcha -> adresse | partner -> workplace_address_street_label
    cedex: z.string().nullish().openapi({
      example: null,
      description: "L'éventuel CEDEX de l'adresse",
    }), // formation -> etablissement_formateur_cedex
    zipCode: z
      .string()
      .openapi({
        example: "75004",
        description: "Le code postal du lieu",
      })
      .nullish(), // formation -> etablissement_formateur_code_postal | pe -> lieuTravail.codePostal | lba -> zip_code | partner -> workplace_address_zipcode
    insee: z
      .string()
      .openapi({
        example: "75004",
        description: "L'éventuel code Insee de la commune du lieu",
      })
      .nullish(), // pe -> lieuTravail.commune, training -> code_commune_insee, lba -> insee_city_code
    departementNumber: z
      .string()
      .openapi({
        example: "44",
        description: "Numéro de département",
      })
      .nullish(), // formation -> num_departement
    region: z
      .string()
      .openapi({
        example: "11",
        description: "Région administrative",
      })
      .nullish(), // formation -> region
    remoteOnly: z.boolean().openapi({}).nullish(), // formation | partner -> contract_remote
  })
  .strict()
  .openapi("Place", {
    description:
      "Un lieu. Selon le contexte il peut s'agir du lieu de formation, du lieu du centre de formation responsable de la formation ou de l'emplacement d'une entreprise offrant une opportunité d'emploi",
  })

export type ILbaItemPlace = z.output<typeof ZLbaItemPlace>

const ZLbaItemRome = z
  .object({
    code: z
      .string()
      .openapi({
        example: "F1603",
        description: "Un code ROME provenant de la nomenclature des métiers de France Travail",
      })
      .nullable(), // pe -> romeCode | lbb/lba -> rome_codes | matcha -> offres.romes
    label: z
      .string()
      .openapi({
        example: "Installation d'équipements sanitaires et thermiques",
        description: "Le libellé correspondant au code ROME",
      })
      .nullish(), // pe -> appellationLibelle | lbb/lba -> matched_rome_label
  })
  .strict()
  .openapi("Rome")

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
      .openapi({
        example: "contact@domaine.fr",
        description: "L'adresse email du contact de référence",
      })
      .nullish(), // pe -> contact.courriel | lbb/lba -> email | formation -> email | matcha -> email
    iv: z.string().nullish(),
    name: z
      .string()
      .openapi({
        example: "Mme Dupont",
        description: "Le nom du contact de référence",
      })
      .nullish(), // pe -> contact.nom | matcha -> prenom nom
    phone: z
      .string()
      .openapi({
        example: "0X XX XX XX XX",
        description: "Le numéro de téléphone du contact de référence",
      })
      .nullish(), // lbb/lba --> phone | matcha -> telephone | pe -> contact.telephone
    info: z
      .string()
      .openapi({
        type: "string",
        description: "Des informations complémentaires concernant le contact de référence",
      })
      .nullish(), // pe -> contact.coordonnees1+contact.coordonnees2+contact.coordonnees3
    url: z.string().openapi({ type: "string", description: "L'url pour postuler" }).nullish(), // pe -> contact.urlPostulation
  })
  .strict()
  .openapi("Contact", { description: "Informations de contact" })

export type ILbaItemContact = z.output<typeof ZLbaItemContact>

const ZLbaItemCompanyHQ = z
  .object({
    siret: extensions.siret.nullable(), // formation -> etablissement_gestionaire_siret
    id: z.string().openapi({ description: "Lieu de formation seulement : l'identifiant de l'établissement gestionnaire" }).nullish(), // formation -> etablissement_gestionnaire_id
    uai: z.string().openapi({ description: "Lieu de formation seulement : l'uai de l'établissement gestionnaire" }).nullish(), // formation -> etablissement_gestionnaire_uai
    type: z.string().openapi({ description: "Lieu de formation seulement : le type de l'établissement gestionnaire" }).nullish(), // formation -> etablissement_gestionnaire_type
    hasConvention: z.string().openapi({ description: "Lieu de formation seulement : indique si l'établissement gestionnaire est conventionné" }).nullish(), // formation -> etablissement_gestionnaire_conventionne
    place: ZLbaItemPlace.partial().nullish(),
    name: z
      .string()
      .openapi({
        example: "ECOLE DE TRAVAIL ORT",
        description: "La raison sociale du centre de formation auquel est affilié la formation",
      })
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
      .openapi({
        example: "ECOLE DE TRAVAIL ORT",
        description: "La raison sociale de l'entreprise",
      })
      .nullish(), // pe -> entreprise.nom | formation -> etablissement_formateur_entreprise_raison_sociale | lbb/lba -> enseigne / raison_sociale | matcha -> enseigne > raison_sociale
    siret: extensions.siret.nullish(), // lbb/lba -> siret | formation -> etablissement_formateur_siret | matcha -> siret | pe -> entreprise.siret réservé à notre front
    size: z
      .string()
      .openapi({
        description: "La tranche d'effectifs de l'entreprise",
      })
      .nullish(), // lbb/lba -> company_size | matcha -> tranche_effectif
    logo: z.string().openapi({ description: "L'url du logo de l'entreprise" }).nullish(), // pe -> entreprise.logo
    description: z.string().openapi({ description: "La description de l'entreprise" }).nullish(), // pe -> entreprise.description
    socialNetwork: z.string().openapi({ description: "Un lien vers un réseau social présentant l'entreprise" }).nullish(), // lbb / lba -> social_network
    url: z.string().openapi({ description: "Un lien vers le site de l'entreprise" }).nullish(), // lbb / lba -> website
    id: z.string().openapi({ description: "Lieu de formation seulement : l'identifiant du lieu de formation" }).nullish(), // formation -> etablissement_formateur_id
    uai: z.string().openapi({ description: "Lieu de formation seulement : l'uai du lieu de formation" }).nullish(), // formation -> etablissement_formateur_uai
    place: ZLbaItemPlace.partial().nullish(),
    mandataire: z.boolean().openapi({ description: "Indique si l'offre est déposée par un CFA mandataire (offres Matcha seulement)" }).nullish(), // matcha -> mandataire
    creationDate: z.date().nullish(), // matcha -> date_creation_etablissement
    headquarter: ZLbaItemCompanyHQ.nullish(), // uniquement pour formation
    opco: ZLbaItemOpco.nullish(), // partner -> workplace_opco
  })
  .strict()
  .openapi({
    description: "Les informations de la société. Selon le contexte il peut s'agir du centre de formation ou de l'entreprise offrant une opportunité d'emploi.",
  })

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
    offer_access_conditions: z.array(z.string()).nullish(), // partner -> offer_access_conditions
  })
  .strict()
  .openapi("LbacJob") // uniquement pour pe et matcha

export type ILbaItemJob = z.output<typeof ZLbaItemJob>

const ZLbaItemTrainingSession = z
  .object({
    startDate: z.date().nullish(),
    endDate: z.date().nullish(),
    isPermanentEntry: z.boolean(),
  })
  .strict()
  .openapi("Session de formation")

export type ILbaItemTrainingSession = z.output<typeof ZLbaItemTrainingSession>

const ZLbaItemTraining = z
  .object({
    description: z.string().nullable(),
    objectif: z.string().nullable(),
    sessions: z.array(ZLbaItemTrainingSession).nullish(),
    duration: z.number().nullable().openapi("Durée de session en jours"),
  })
  .strict()
  .openapi("Training")

export type ILbaItemTraining = z.output<typeof ZLbaItemTraining>

const ZLbaItemTraining2 = z
  .object({
    description: z.string().nullish(),
    objectif: z.string().nullish(),
    sessions: z.array(ZLbaItemTrainingSession).nullish(),
    duration: z.number().nullish().openapi("Durée de session en jours"),
    title: z.string().nullish().openapi({
      description: "Le titre de la formation",
      example: "CAP Monteur en Installation Thermique",
    }), // formation -> intitule_long OU intitule_court
    idRco: z.string().nullish(), // formation -> id_formation
    cleMinistereEducatif: z.string().nullish(), // formation
    target_diploma_level: z
      .string()
      .openapi({
        example: "3 (CAP...)",
        description: "Le niveau de la formation.",
      })
      .nullish(), // formation -> niveau
    diploma: z
      .string()
      .openapi({
        example: "CERTIFICAT D'APTITUDES PROFESSIONNELLES",
        description: "Le diplôme délivré par la formation.",
      })
      .nullish(), // formation -> diplome
    cfd: z
      .string()
      .openapi({
        example: "50023324",
        description: "Le code formation diplôme de l'éducation nationale.",
      })
      .nullish(), // formation -> cfd
    rncpCode: z
      .string()
      .openapi({
        example: "RNCP31899",
        description: "Le code RNCP.",
      })
      .nullish(), // formation -> rncp_code
    rncpLabel: z
      .string()
      .openapi({
        example: "Intégrateur - Développeur Web",
        description: "L'intitulé RNCP.",
      })
      .nullish(), // formation -> rncp_intitule
    onisepUrl: z
      .string()
      .openapi({
        example: "http://www.onisep.fr/http/redirection/formation/identifiant/7872",
        description: "Le lien vers la description de la formation sur le site de l'ONISEP",
      })
      .nullish(), // formation -> onisep_url
    romes: z.array(ZLbaItemRome).nullish(),
  })
  .strict()
  .openapi("Training")

export type ILbaItemTraining2 = z.output<typeof ZLbaItemTraining2>

export const ZLbaItemFormation = z
  .object({
    ideaType: z.literal(LBA_ITEM_TYPE_OLD.FORMATION).openapi({
      example: LBA_ITEM_TYPE_OLD.FORMATION,
      description: "Le type labonnealternance d'objet, ici la seule valeur possible est 'formation'",
    }),
    title: z.string().nullish().openapi({
      description: "Le titre de la formation",
      example: "CAP Monteur en Installation Thermique",
    }), // formation -> intitule_long OU intitule_court
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.openapi({
      description: "Le lieu de formation",
    }).nullable(),
    company: ZLbaItemCompany.nullable(),

    longTitle: z.string().nullish().openapi({
      example: "MONTEUR EN INSTALLATIONS THERMIQUES (CAP)",
      description: "Le titre en version longue de la formation",
    }), // formation -> intitule_long,
    id: z.string().nullable().openapi({
      example: "5e8dfad720ff3b2161269d86",
      description: "L'identifiant de la formation dans le catalogue du Réseau des Carif-Oref.",
    }), // formation -> id
    detailsLoaded: z.boolean().nullish(),
    idRco: z.string().nullish(), // formation -> id_formation
    idRcoFormation: z.string().nullish(), // formation -> id_rco_formation

    /** TODO API V2: move inside training<ILbaItemTraining> */
    cleMinistereEducatif: z.string().nullish(), // formation
    target_diploma_level: z
      .string()
      .openapi({
        example: "3 (CAP...)",
        description: "Le niveau de la formation.",
      })
      .nullish(), // formation -> niveau
    diploma: z
      .string()
      .openapi({
        example: "CERTIFICAT D'APTITUDES PROFESSIONNELLES",
        description: "Le diplôme délivré par la formation.",
      })
      .nullish(), // formation -> diplome
    cfd: z
      .string()
      .openapi({
        example: "50023324",
        description: "Le code formation diplôme de l'éducation nationale.",
      })
      .nullish(), // formation -> cfd
    rncpCode: z
      .string()
      .openapi({
        example: "RNCP31899",
        description: "Le code RNCP.",
      })
      .nullish(), // formation -> rncp_code
    rncpLabel: z
      .string()
      .openapi({
        example: "Intégrateur - Développeur Web",
        description: "L'intitulé RNCP.",
      })
      .nullish(), // formation -> rncp_intitule
    rncpEligibleApprentissage: z
      .boolean()
      .openapi({
        example: true,
        description: "Indique si le titre RNCP est éligible en apprentissage.",
      })
      .nullish(), // formation -> rncp_eligible_apprentissage
    period: z.string().nullish(), // formation -> periode
    capacity: z
      .string()
      .openapi({
        example: "15",
        description: "Capacité d'accueil.",
      })
      .nullish(), // formation -> capacite
    onisepUrl: z
      .string()
      .openapi({
        example: "http://www.onisep.fr/http/redirection/formation/identifiant/7872",
        description: "Le lien vers la description de la formation sur le site de l'ONISEP",
      })
      .nullish(), // formation -> onisep_url

    romes: z.array(ZLbaItemRome).nullish(),

    training: ZLbaItemTraining.nullish(),

    rdvContext: z.any().nullish(),
  })
  .strict()
  .openapi("Formation")

export type ILbaItemFormation = z.output<typeof ZLbaItemFormation>

export const ZLbaItemFormation2 = z
  .object({
    type: z.literal(LBA_ITEM_TYPE.FORMATION).openapi({
      example: LBA_ITEM_TYPE.FORMATION,
      description: "Le type labonnealternance d'objet, ici la seule valeur possible est 'formation'",
    }),
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.openapi({
      description: "Le lieu de formation",
    }).nullable(),
    company: ZLbaItemCompany.omit({
      id: true,
      url: true,
      socialNetwork: true,
    }).nullable(),
    training: ZLbaItemTraining2.nullish(),
  })
  .strict()
  .openapi("Formation")

export type ILbaItemFormation2 = z.output<typeof ZLbaItemFormation2>

export const ZLbaItemLbaJob = z
  .object({
    ideaType: z.literal(LBA_ITEM_TYPE_OLD.MATCHA),
    // ideaType: z.literal(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA),
    title: z.string().nullish(), // matcha -> offres.libelle || offres.rome_appellation_label
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),
    id: z.string().nullable().openapi({}), // matcha -> id_form
    target_diploma_level: z
      .string()
      .openapi({
        example: "3 (CAP...)",
        description: "Le niveau de la formation.",
      })
      .nullish(), // matcha -> offres.niveau
    job: ZLbaItemJob.nullish(),
    romes: z.array(ZLbaItemRome).nullish(),
    nafs: z.array(ZLbaItemNaf).nullish(),
    applicationCount: z.number(), // calcul en fonction du nombre de candidatures enregistrées
    detailsLoaded: z.boolean().nullish(),
    token: z.string().nullish(), // KBA 2024_05_20 : for API V2 only, remove nullish when fully migrated
    recipient_id: z.string().describe("Identifiant personnalisé (ID mongoDB préfixé du nom de la collection) envoyé au server pour la candidature"),
  })
  .strict()
  .openapi("LbaJob")

export type ILbaItemLbaJob = z.output<typeof ZLbaItemLbaJob>
export const ZLbaItemLbaJobReturnedByAPI = z.object({ matchas: z.array(ZLbaItemLbaJob) })
export type ILbaItemLbaJobReturnedByAPI = z.output<typeof ZLbaItemLbaJobReturnedByAPI>

export const ZLbaItemPartnerJob = z
  .object({
    ideaType: z.literal(LBA_ITEM_TYPE_OLD.PARTNER_JOB),
    title: z.string(), // partnerJob -> offer_title
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),
    id: z.string(), // partnerJob -> _id
    target_diploma_level: z // partnerJob -> offer_target_diploma
      .string()
      .openapi({
        example: "3 (CAP...)",
        description: "Le niveau de la formation.",
      })
      .nullish(), // matcha -> offres.niveau
    job: ZLbaItemJob,
    romes: z.array(ZLbaItemRome).nullish(),
    nafs: z.array(ZLbaItemNaf).nullish(),
    detailsLoaded: z.boolean().nullish(),
  })
  .strict()
  .openapi("PartnerJob")

export type ILbaItemPartnerJob = z.output<typeof ZLbaItemPartnerJob>
export const ZLbaItemPartnerJobReturnedByAPI = z.object({ partnerJobs: z.array(ZLbaItemPartnerJob) })
export type ILbaItemPartnerJobReturnedByAPI = z.output<typeof ZLbaItemPartnerJobReturnedByAPI>

export const ZLbaItemLbaCompany = z
  .object({
    ideaType: z.literal(LBA_ITEM_TYPE_OLD.LBA),
    // ideaType: z.literal(LBA_ITEM_TYPE.RECRUTEURS_LBA),
    id: z.string().nullable().openapi({}),
    title: z.string().nullish(), // lbb/lba -> enseigne
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),
    url: z.string().nullish(), // partner -> workplace_website
    nafs: z.array(ZLbaItemNaf).nullish(),
    applicationCount: z.number(), // calcul en fonction du nombre de candidatures enregistrées
    detailsLoaded: z.boolean().nullish(),
    token: z.string().nullish(), // KBA 2024_05_20 : for API V2 only, remove nullish when fully migrated
    recipient_id: z.string().describe("Identifiant personnalisé (ID mongoDB préfixé du nom de la collection) envoyé au server pour la candidature"),
  })
  .strict()
  .openapi("LbaCompany")

export type ILbaItemLbaCompany = z.output<typeof ZLbaItemLbaCompany>
export const ZLbaItemLbaCompanyReturnedByAPI = z.object({ lbaCompanies: z.array(ZLbaItemLbaCompany) })
export type ILbaItemLbaCompanyReturnedByAPI = z.output<typeof ZLbaItemLbaCompanyReturnedByAPI>

export const ZLbaItemFtJob = z
  .object({
    ideaType: z.literal(LBA_ITEM_TYPE_OLD.PEJOB),
    // ideaType: z.literal(LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES),
    id: z.string().nullable().openapi({}),
    title: z.string().nullish(), // pe -> intitule
    contact: ZLbaItemContact.nullish(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),
    url: z.string().nullish(), // pe -> reconstruction depuis id
    job: ZLbaItemJob.nullish(),
    romes: z.array(ZLbaItemRome).nullish(),
    nafs: z.array(ZLbaItemNaf).nullish(),
    detailsLoaded: z.boolean().nullish(),
  })
  .strict()
  .openapi("PeJob")

export type ILbaItemFtJob = z.output<typeof ZLbaItemFtJob>
export const ZLbaItemFtJobReturnedByAPI = z.object({ peJobs: z.array(ZLbaItemFtJob) })
export type ILbaItemFtJobReturnedByAPI = z.output<typeof ZLbaItemFtJobReturnedByAPI>

export const ZLbaItemFormationResult = z
  .object({
    results: z.array(ZLbaItemFormation).openapi({ description: "Un tableau de formations correspondantes aux critères" }),
  })
  .strict()
  .openapi({
    description:
      "Un tableau contenant la liste des formations correspondants aux critères transmis en paramètre de la requête. Le tableau peut être vide si aucune formation ne correspond.",
  })
export type ILbaItemFormationResult = z.output<typeof ZLbaItemFormationResult>
