const etablissementFormateurInfo = require("./etablissement.formateur.sub");
const etablissementGestionnaireInfo = require("./etablissement.gestionnaire.sub");
const etablissementReferenceInfo = require("./etablissement.reference.sub");

const mnaFormationSchema = {
  cle_ministere_educatif: {
    index: true,
    type: String,
    default: null,
    description: "Clé unique de la formation (pour envoi aux ministères éducatifs)",
  },
  cfd: {
    index: true,
    type: String,
    default: null,
    description: "Code formation diplome (education nationale)",
  },
  cfd_specialite: {
    type: Object,
    default: null,
    description: "Lettre spécialité du code cfd",
  },
  cfd_outdated: {
    type: Boolean,
    default: false,
    description: "BCN : cfd périmé (fermeture avant le 31 aout de l'année courante)",
  },
  cfd_date_fermeture: {
    type: Date,
    default: null,
    description: "Date de fermeture du cfd",
  },
  cfd_entree: {
    index: true,
    type: String,
    default: null,
    description: "Code formation diplome d'entrée (année 1 de l'apprentissage)",
  },
  mef_10_code: {
    type: String,
    default: null,
    description: "Code MEF 10 caractères",
  },
  mefs_10: {
    type: [Object],
    default: [],
    description: "Tableau de Code MEF 10 caractères et modalités (filtrés pour Affelnet si applicable)",
  },
  nom_academie: {
    type: String,
    default: null,
    description: "Nom de l'académie",
  },
  num_academie: {
    type: String,
    default: 0,
    description: "Numéro de l'académie",
  },
  code_postal: {
    type: String,
    default: null,
    description: "Code postal",
  },
  code_commune_insee: {
    type: String,
    default: null,
    description: "Code commune INSEE",
  },
  num_departement: {
    type: String,
    default: null,
    description: "Numéro de departement",
  },
  nom_departement: {
    type: String,
    default: null,
    description: "Nom du departement",
  },
  region: {
    type: String,
    default: null,
    description: "Numéro de departement",
  },
  localite: {
    type: String,
    default: null,
    description: "Localité",
  },
  uai_formation: {
    index: true,
    type: String,
    default: null,
    description: "UAI du lieu de la formation",
  },
  nom: {
    type: String,
    default: null,
    description: "Nom de la formation déclaratif",
  },
  intitule_long: {
    type: String,
    default: null,
    description: "Intitulé long de la formation normalisé BCN",
  },
  intitule_court: {
    type: String,
    default: null,
    description: "Intitulé court de la formation normalisé BCN",
  },
  diplome: {
    type: String,
    default: null,
    description: "Diplôme ou titre visé",
  },
  niveau: {
    type: String,
    default: null,
    description: "Niveau de la formation",
  },
  onisep_url: {
    type: String,
    default: null,
    description: "Url de redirection vers le site de l'ONISEP",
  },

  onisep_intitule: {
    type: String,
    default: null,
    description: "Intitulé éditorial l'ONISEP",
  },

  onisep_libelle_poursuite: {
    type: String,
    default: null,
    description: "Libellé poursuite étude l'ONISEP (séparateur ;)",
  },
  onisep_lien_site_onisepfr: {
    type: String,
    default: null,
    description: "Lien vers site de l'ONISEP api",
  },
  onisep_discipline: {
    type: String,
    default: null,
    description: "Disciplines ONISEP (séparateur ;)",
  },
  onisep_domaine_sousdomaine: {
    type: String,
    default: null,
    description: "Domaine et sous domaine ONISEP (séparateur ;)",
  },

  rncp_code: {
    index: true,
    type: String,
    default: null,
    description: "Code RNCP",
  },
  rncp_intitule: {
    type: String,
    default: null,
    description: "Intitulé du code RNCP",
  },
  rncp_eligible_apprentissage: {
    type: Boolean,
    default: false,
    description: "Le titre RNCP est éligible en apprentissage",
  },
  rncp_details: {
    type: {
      date_fin_validite_enregistrement: {
        type: String,
        default: null,
        description: "Date de validité de la fiche",
      },
      active_inactive: {
        type: String,
        default: null,
        description: "fiche active ou non",
      },
      etat_fiche_rncp: {
        type: String,
        default: null,
        description: "état fiche ex: Publiée",
      },
      niveau_europe: {
        type: String,
        default: null,
        description: "Niveau europeen ex: niveauu5",
      },
      code_type_certif: {
        type: String,
        default: null,
        description: "Code type de certification (ex: DE)",
      },
      type_certif: {
        type: String,
        default: null,
        description: "Type de certification (ex: diplome d'etat)",
      },
      ancienne_fiche: {
        type: [String],
        default: null,
        description: "Code rncp de l'ancienne fiche",
      },
      nouvelle_fiche: {
        type: [String],
        default: null,
        description: "Code rncp de la nouvelle fiche",
      },
      demande: {
        type: Number,
        default: 0,
        description: "demande en cours de d'habilitation",
      },
      certificateurs: {
        type: [Object],
        default: [],
        description: "Certificateurs",
      },
      nsf_code: {
        type: String,
        default: null,
        description: "code NSF",
      },
      nsf_libelle: {
        type: String,
        default: null,
        description: "libéllé NSF",
      },
      romes: {
        type: [Object],
        default: [],
        description: "Romes",
      },
      blocs_competences: {
        type: [Object],
        default: [],
        description: "Blocs de compétences",
      },
      voix_acces: {
        type: [Object],
        default: [],
        description: "voix d'accès",
      },
      partenaires: {
        type: [Object],
        default: [],
        description: "partenaires",
      },
    },
    default: null,
    description: "Détails RNCP (bloc de compétences etc..)",
  },
  rome_codes: {
    type: [String],
    default: [],
    description: "Codes ROME",
  },
  /* commenté tant que pas utilisé periode: {
    type: [Date],
    default: null,
    description: "Période d'inscription à la formation",
  },*/
  capacite: {
    type: String,
    default: null,
    description: "Capacité d'accueil",
  },
  duree: {
    type: String,
    default: null,
    description: "Durée de la formation en années",
  },
  annee: {
    type: String,
    default: null,
    description: "Année de la formation (cursus)",
  },
  email: {
    type: String,
    default: null,
    select: false,
    noIndex: true,
    description: "Email du contact pour cette formation",
  },
  parcoursup_reference: {
    type: Boolean,
    default: false,
    description: "La formation est présent sur parcourSup",
  },
  parcoursup_a_charger: {
    type: Boolean,
    default: false,
    description: "La formation doit être ajouter à ParcourSup",
  },
  parcoursup_statut: {
    type: String,
    enum: [
      "hors périmètre",
      "publié",
      "non publié",
      "à publier (sous condition habilitation)",
      "à publier (vérifier accès direct postbac)",
      "à publier (soumis à validation Recteur)",
      "à publier",
      "en attente de publication",
    ],
    default: "hors périmètre",
    description: "Statut parcoursup",
  },
  parcoursup_statut_history: {
    type: [Object],
    default: [],
    description: "Parcoursup : historique des statuts",
    noIndex: true,
  },
  parcoursup_error: {
    type: String,
    default: null,
    description: "Erreur lors de la création de la formation sur ParcourSup (via le WS)",
  },
  parcoursup_id: {
    index: true,
    type: String,
    default: null,
    description: "ids ParcourSup",
  },
  affelnet_reference: {
    type: Boolean,
    default: false,
    description: "La formation est présent sur affelnet",
  },
  affelnet_a_charger: {
    type: Boolean,
    default: false,
    description: "**[DEPRECATED]** La formation doit être ajouter à affelnet",
  },
  affelnet_statut: {
    type: String,
    enum: [
      "hors périmètre",
      "publié",
      "non publié",
      "à publier (soumis à validation)",
      "à publier",
      "en attente de publication",
    ],
    default: "hors périmètre",
    description: "Statut affelnet",
  },
  affelnet_statut_history: {
    type: [Object],
    default: [],
    description: "Affelnet : historique des statuts",
    noIndex: true,
  },
  source: {
    type: String,
    default: null,
    description: "Origine de la formation",
  },
  commentaires: {
    type: String,
    default: null,
    description: "Commentaires",
  },
  opcos: {
    type: [String],
    default: null,
    description: "Liste des opcos de la formation",
  },
  info_opcos: {
    type: Number,
    default: 0,
    description: "Code du statut de liaison avec un/des opcos",
  },
  info_opcos_intitule: {
    type: String,
    default: null,
    description: "Intitule du statut de liaison avec un/des opcos",
  },
  published: {
    index: true,
    type: Boolean,
    default: false,
    description: "Est publiée, la formation est éligible pour le catalogue",
  },
  rco_published: {
    type: Boolean,
    default: false,
    description: "Est publiée dans le flux rco",
  },
  draft: {
    type: Boolean,
    default: false,
    description: "En cours de creation",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date d'ajout en base de données",
  },
  updates_history: {
    type: [Object],
    default: [],
    description: "Historique des mises à jours",
    noIndex: true,
  },
  last_update_at: {
    type: Date,
    default: Date.now,
    description: "Date de dernières mise à jour",
  },
  last_update_who: {
    type: String,
    default: null,
    description: "Qui a réalisé la derniere modification",
  },

  // Flags
  to_update: {
    index: true,
    type: Boolean,
    default: false,
    description: "Formation à mette à jour lors du script d'enrichissement",
  },

  // Product specific
  idea_geo_coordonnees_etablissement: {
    type: String,
    implicit_type: "geo_point",
    description: "Latitude et longitude de l'établissement recherchable dans Idea",
  },

  update_error: {
    type: String,
    default: null,
    description: "Erreur lors de la mise à jour de la formation",
  },

  lieu_formation_geo_coordonnees: {
    type: String,
    implicit_type: "geo_point",
    description: "Latitude et longitude du lieu de formation",
  },
  lieu_formation_adresse: {
    type: String,
    default: null,
    description: "Adresse du lieu de formation",
  },
  lieu_formation_adresse_computed: {
    type: String,
    default: null,
    description: "Adresse du lieu de formation déduit de la géolocalisation le flux RCO",
  },
  lieu_formation_siret: {
    type: String,
    default: null,
    description: "Siret du lieu de formation",
  },
  id_rco_formation: {
    index: true,
    type: String,
    default: null,
    description: "Id de formation RCO (id_formation + id_action + id_certifinfo)",
  },
  id_formation: {
    index: true,
    type: String,
    default: null,
    description: "Identifiant de la formation",
  },
  id_action: {
    index: true,
    type: String,
    default: null,
    description: "Identifant des actions concaténés",
  },
  ids_action: {
    index: true,
    type: [String],
    default: null,
    description: "Identifant des actions concaténés",
  },
  id_certifinfo: {
    index: true,
    type: String,
    default: null,
    description: "Identifant certifInfo (unicité de la certification)",
  },
  tags: {
    type: [String],
    default: [],
    description: "Tableau de tags (2020, 2021, etc.)",
  },
  libelle_court: {
    type: String,
    default: null,
    description: "BCN : libelle court fusion table n_formation_diplome ou v_formation_diplome",
  },
  niveau_formation_diplome: {
    type: String,
    default: null,
    description: "BCN : niveau formation diplome",
  },
  affelnet_infos_offre: {
    type: String,
    default: null,
    description: "Affelnet : Informations offre de formation",
  },
  affelnet_code_nature: {
    type: String,
    default: null,
    description: "Affelnet : code nature de l'établissement de formation",
  },
  affelnet_secteur: {
    type: String,
    enum: ["PR", "PU", null],
    default: null,
    description: "Affelnet : type d'établissement (PR: Privé / PU: Public)",
  },
  affelnet_raison_depublication: {
    type: String,
    default: null,
    description: "Affelnet : raison de dépublication",
  },
  bcn_mefs_10: {
    type: [Object],
    default: null,
    description: "BCN : Codes MEF 10 caractères",
  },
  editedFields: {
    type: Object,
    default: null,
    description: "Champs édités par un utilisateur",
  },
  parcoursup_raison_depublication: {
    type: String,
    default: null,
    description: "Parcoursup : raison de dépublication",
  },
  distance_lieu_formation_etablissement_formateur: {
    type: Number,
    default: null,
    description: "distance entre le Lieu de formation et l'établissement formateur",
  },
  niveau_entree_obligatoire: {
    type: Number,
    default: null,
    description: "Niveau d'entrée de l'apprenti minimum obligatoire pour cette formation",
  },
  entierement_a_distance: {
    type: Boolean,
    default: false,
    description: "Renseigné si la formation peut être suivie entièrement à distance",
  },
  ...etablissementGestionnaireInfo,
  ...etablissementFormateurInfo,
  ...etablissementReferenceInfo,
};

module.exports = mnaFormationSchema;
