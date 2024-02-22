import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { z } from "../helpers/zodWithOpenApi"

import { ZRomeDetail } from "./rome.model"

const ZLbaItemPlace = z
  .object({
    distance: z
      .number()
      .openapi({
        example: 3.5,
        description: "La distance du lieu par rapport au centre de recherche en kilomètres",
      })
      .nullable(), // distance au centre de recherche en km. pe --> lieutTravail.distance recalculé par turf.js | formation --> sort[0] | lbb/lba -> distance | matcha -> sort[0]
    fullAddress: z
      .string()
      .openapi({
        example: "4 RUE DES ROSIERS PARIS 4 75004",
        description: "L'adresse postale complète du lieu",
      })
      .nullish(), // adresse postale reconstruite à partir des éléments d'adresse fournis | matcha -> adresse | formation -> lieu_formation_adresse + code_postal + localite OU etablissement_formateur_adresse + ...complement_adresse + ...code_postal + ...localite + ...cedex OU etablissement_gestionnaire_adresse + ...complement_adresse + ...localite + ...cedex
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
    city: z
      .string()
      .openapi({
        example: "PARIS 4",
        description: "La ville",
      })
      .nullish(), // pe -> lieuTravail.libelle | formation -> localite | pe -> city | lba -> city
    address: z.string().nullish().openapi({
      example: "4 RUE DES ROSIERS",
      description: "L'adresse du lieu",
    }), // formation -> etablissement_formateur_adresse, etablissement_formateur_complement_adresse | lbb / lba -> address -> street_number + street_name | matcha -> adresse
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
      .nullish(), // formation -> etablissement_formateur_code_postal | pe -> lieuTravail.codePostal | lba -> zip_code
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
    remoteOnly: z.boolean().openapi({}).nullish(), // formation
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
        description: "Un code ROME provenant de la nomenclature des métiers de Pôle emploi",
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
      .nullish(), // lbb/lba --> phone | matcha -> telephone
    info: z
      .string()
      .openapi({
        type: "string",
        description: "Des informations complémentaires concernant le contact de référence",
      })
      .nullish(), // pe -> contact.coordonnees1+contact.coordonnees2+contact.coordonnees3
  })
  .strict()
  .openapi("Contact", { description: "Informations de contact" })

export type ILbaItemContact = z.output<typeof ZLbaItemContact>

const ZLbaItemCompanyHQ = z
  .object({
    siret: extensions.siret.nullable(), // formation -> etablissement_gestionaire_siret
    id: z.string().openapi({ description: "Lieu de formation seulement : l'identifiant de l'établissement gestionnaire" }).nullable(), // formation -> etablissement_gestionnaire_id
    uai: z.string().openapi({ description: "Lieu de formation seulement : l'uai de l'établissement gestionnaire" }).nullable(), // formation -> etablissement_gestionnaire_uai
    type: z.string().openapi({ description: "Lieu de formation seulement : le type de l'établissement gestionnaire" }).nullable(), // formation -> etablissement_gestionnaire_type
    hasConvention: z.string().openapi({ description: "Lieu de formation seulement : indique si l'établissement gestionnaire est conventionné" }).nullable(), // formation -> etablissement_gestionnaire_conventionne
    place: ZLbaItemPlace.partial().nullable(),
    name: z
      .string()
      .openapi({
        example: "ECOLE DE TRAVAIL ORT",
        description: "La raison sociale du centre de formation auquel est affilié la formation",
      })
      .nullable(), // formation -> etablissement_gestionnaire_entreprise_raison_sociale
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
    opco: ZLbaItemOpco.nullish(),
  })
  .strict()
  .openapi({
    description: "Les informations de la société. Selon le contexte il peut s'agir du centre de formation ou de l'entreprise offrant une opportunité d'emploi.",
  })

export type ILbaItemCompany = z.output<typeof ZLbaItemCompany>

const ZLbaItemJob = z
  .object({
    description: z.string().nullable(), // pe -> description | matcha -> description
    employeurDescription: z.string().nullable().optional(), // matcha -> job.job_employer_description
    creationDate: z.date().nullable(), // pe -> dateCreation | matcha -> createdAt
    id: z.string().nullable(), // pe -> id | matcha -> id mongo offre
    contractType: z.string().nullable(), // pe -> typeContrat | matcha -> offres.type
    contractDescription: z.string().nullish(), // pe -> typeContratLibelle
    duration: z.string().nullish(), // pe -> dureeTravailLibelle
    jobStartDate: z.date().optional().nullable(), // matcha -> offres.date_debut_apprentissage
    romeDetails: ZRomeDetail.optional().nullish(), // matcha -> offres.rome_detail -> détail du code ROME
    rythmeAlternance: z.string().nullish(), // matcha -> offres.rythme_alternance
    elligibleHandicap: z.boolean().nullish(), // matcha -> offres.is_disabled_elligible
    dureeContrat: z.string().nullish(), // matcha -> offres.duree_contrat
    quantiteContrat: z.number().nullish(), // matcha -> offres.quantite
    status: z.enum(["Active", "Pourvue", "Annulée", "En attente"]).nullish(),
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

export const ZLbaItemFormation = z
  .object({
    ideaType: z.literal("formation").openapi({
      example: "formation",
      description: "Le type labonnealternance d'objet, ici la seule valeur possible est 'formation'",
    }),
    title: z.string().nullish().openapi({
      description: "Le titre de la formation",
      example: "CAP Monteur en Installation Thermique",
    }), // formation -> intitule_long OU intitule_court
    contact: ZLbaItemContact.nullable(),
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
      description: "L'identifiant de la formation dans le catalogue de la mission apprentissage.",
    }), // formation -> id
    idRco: z.string().nullable(), // formation -> id_formation
    idRcoFormation: z.string().nullable(), // formation -> id_rco_formation

    /** TODO API V2: move inside training<ILbaItemTraining> */
    cleMinistereEducatif: z.string().nullable(), // formation
    diplomaLevel: z
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
      .nullable(), // formation -> diplome
    cfd: z
      .string()
      .openapi({
        example: "50023324",
        description: "Le code formation diplôme de l'éducation nationale.",
      })
      .nullable(), // formation -> cfd
    rncpCode: z
      .string()
      .openapi({
        example: "RNCP31899",
        description: "Le code RNCP.",
      })
      .nullable(), // formation -> rncp_code
    rncpLabel: z
      .string()
      .openapi({
        example: "Intégrateur - Développeur Web",
        description: "L'intitulé RNCP.",
      })
      .nullable(), // formation -> rncp_intitule
    rncpEligibleApprentissage: z
      .boolean()
      .openapi({
        example: true,
        description: "Indique si le titre RNCP est éligible en apprentissage.",
      })
      .nullish(), // formation -> rncp_eligible_apprentissage
    period: z.string().nullable(), // formation -> periode
    capacity: z
      .string()
      .openapi({
        example: "15",
        description: "Capacité d'accueil.",
      })
      .nullable(), // formation -> capacite
    onisepUrl: z
      .string()
      .openapi({
        example: "http://www.onisep.fr/http/redirection/formation/identifiant/7872",
        description: "Le lien vers la description de la formation sur le site de l'ONISEP",
      })
      .nullable(), // formation -> onisep_url

    romes: z.array(ZLbaItemRome).nullable(),

    training: ZLbaItemTraining.nullable(),
  })
  .strict()
  .openapi("Formation")

export type ILbaItemFormation = z.output<typeof ZLbaItemFormation>

export const ZLbaItemLbaJob = z
  .object({
    ideaType: z.literal("matcha"),
    title: z.string().nullish(), // matcha -> offres.libelle || offres.rome_appellation_label
    contact: ZLbaItemContact.nullable(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),

    id: z.string().nullable().openapi({}), // matcha -> id_form
    diplomaLevel: z
      .string()
      .openapi({
        example: "3 (CAP...)",
        description: "Le niveau de la formation.",
      })
      .nullish(), // matcha -> offres.niveau
    job: ZLbaItemJob.nullable(),
    romes: z.array(ZLbaItemRome).nullable(),
    nafs: z.array(ZLbaItemNaf).nullable(),
    applicationCount: z.number(), // calcul en fonction du nombre de candidatures enregistrées
  })
  .strict()
  .openapi("LbaJob")

export type ILbaItemLbaJob = z.output<typeof ZLbaItemLbaJob>

export const ZLbaItemLbaCompany = z
  .object({
    ideaType: z.literal("lba"),
    title: z.string().nullish(), // lbb/lba -> enseigne
    contact: ZLbaItemContact.nullable(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),

    url: z.null(),
    nafs: z.array(ZLbaItemNaf).nullable(),
    applicationCount: z.number(), // calcul en fonction du nombre de candidatures enregistrées
  })
  .strict()
  .openapi("LbaCompany")

export type ILbaItemLbaCompany = z.output<typeof ZLbaItemLbaCompany>

export const ZLbaItemPeJob = z
  .object({
    ideaType: z.literal("peJob"),
    title: z.string().nullish(), // pe -> intitule
    contact: ZLbaItemContact.nullable(),
    place: ZLbaItemPlace.nullable(),
    company: ZLbaItemCompany.nullable(),

    url: z.string().nullable(), // pe -> reconstruction depuis id
    job: ZLbaItemJob.nullable(),
    romes: z.array(ZLbaItemRome).nullable(),
    nafs: z.array(ZLbaItemNaf).nullable(),
  })
  .strict()
  .openapi("PeJob")

export type ILbaItemPeJob = z.output<typeof ZLbaItemPeJob>

export const ZLbaItemFormationResult = z
  .object({
    results: z.array(ZLbaItemFormation).openapi({ description: "Un tableau de formations correspondantes aux critères" }),
  })
  .strict()
  .openapi({
    description:
      "Un tableau contenant la liste des formations correspondants aux critères transmis en paramètre de la requête. Le tableau peut être vide si aucune formation ne correspond.",
  })
