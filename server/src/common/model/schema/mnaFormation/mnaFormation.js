import { etablissementFormateurInfo } from "./etablissement.formateur.sub.js"
import { etablissementGestionnaireInfo } from "./etablissement.gestionnaire.sub.js"
import { etablissementReferenceInfo } from "./etablissement.reference.sub.js"

export const mnaFormationSchema = {
  cle_ministere_educatif: {
    index: true,
    type: String,
    description: "Clé unique de la formation (pour envoi aux ministères éducatifs)",
  },
  cfd: {
    index: true,
    type: String,
    description: "Code formation diplome (education nationale)",
  },
  cfd_specialite: {
    type: Object,
    description: "Lettre spécialité du code cfd",
  },
  cfd_outdated: {
    type: Boolean,
    description: "BCN : cfd périmé (fermeture avant le 31 aout de l'année courante)",
  },
  cfd_date_fermeture: {
    type: Date,
    description: "Date de fermeture du cfd",
  },
  cfd_entree: {
    index: true,
    type: String,
    description: "Code formation diplome d'entrée (année 1 de l'apprentissage)",
  },
  mef_10_code: {
    type: String,
    description: "Code MEF 10 caractères",
  },
  mefs_10: {
    type: [Object],
    description: "Tableau de Code MEF 10 caractères et modalités (filtrés pour Affelnet si applicable)",
  },
  nom_academie: {
    type: String,
    description: "Nom de l'académie",
  },
  num_academie: {
    type: String,
    description: "Numéro de l'académie",
  },
  code_postal: {
    type: String,
    description: "Code postal",
  },
  code_commune_insee: {
    type: String,
    description: "Code commune INSEE",
  },
  num_departement: {
    type: String,
    description: "Numéro de departement",
  },
  nom_departement: {
    type: String,
    description: "Nom du departement",
  },
  region: {
    type: String,
    description: "Numéro de departement",
  },
  localite: {
    type: String,
    description: "Localité",
  },
  uai_formation: {
    index: true,
    type: String,
    description: "UAI du lieu de la formation",
  },
  nom: {
    type: String,
    description: "Nom de la formation déclaratif",
  },
  intitule_long: {
    type: String,
    description: "Intitulé long de la formation normalisé BCN",
  },
  intitule_court: {
    type: String,
    description: "Intitulé court de la formation normalisé BCN",
  },
  diplome: {
    type: String,
    description: "Diplôme ou titre visé",
  },
  niveau: {
    type: String,
    description: "Niveau de la formation",
  },
  onisep_url: {
    type: String,
    description: "Url de redirection vers le site de l'ONISEP",
  },

  onisep_intitule: {
    type: String,
    description: "Intitulé éditorial l'ONISEP",
  },

  onisep_libelle_poursuite: {
    type: String,
    description: "Libellé poursuite étude l'ONISEP (séparateur ;)",
  },
  onisep_lien_site_onisepfr: {
    type: String,
    description: "Lien vers site de l'ONISEP api",
  },
  onisep_discipline: {
    type: String,
    description: "Disciplines ONISEP (séparateur ;)",
  },
  onisep_domaine_sousdomaine: {
    type: String,
    description: "Domaine et sous domaine ONISEP (séparateur ;)",
  },

  rncp_code: {
    index: true,
    type: String,
    description: "Code RNCP",
  },
  rncp_intitule: {
    type: String,
    description: "Intitulé du code RNCP",
  },
  rncp_eligible_apprentissage: {
    type: Boolean,
    description: "Le titre RNCP est éligible en apprentissage",
  },
  rncp_details: {
    type: {
      date_fin_validite_enregistrement: {
        type: String,
        description: "Date de validité de la fiche",
      },
      active_inactive: {
        type: String,
        description: "fiche active ou non",
      },
      etat_fiche_rncp: {
        type: String,
        description: "état fiche ex: Publiée",
      },
      niveau_europe: {
        type: String,
        description: "Niveau europeen ex: niveauu5",
      },
      code_type_certif: {
        type: String,
        description: "Code type de certification (ex: DE)",
      },
      type_certif: {
        type: String,
        description: "Type de certification (ex: diplome d'etat)",
      },
      ancienne_fiche: {
        type: [String],
        description: "Code rncp de l'ancienne fiche",
      },
      nouvelle_fiche: {
        type: [String],
        description: "Code rncp de la nouvelle fiche",
      },
      demande: {
        type: Number,
        description: "demande en cours de d'habilitation",
      },
      certificateurs: {
        type: [Object],
        description: "Certificateurs",
      },
      nsf_code: {
        type: String,
        description: "code NSF",
      },
      nsf_libelle: {
        type: String,
        description: "libéllé NSF",
      },
      romes: {
        type: [Object],
        description: "Romes",
      },
      blocs_competences: {
        type: [Object],
        description: "Blocs de compétences",
      },
      voix_acces: {
        type: [Object],
        description: "voix d'accès",
      },
      partenaires: {
        type: [Object],
        description: "partenaires",
      },
    },
    description: "Détails RNCP (bloc de compétences etc..)",
  },
  rome_codes: {
    type: [String],
    description: "Codes ROME",
  },
  /* commenté tant que pas utilisé periode: {
    type: [Date],
    description: "Période d'inscription à la formation",
  },*/
  capacite: {
    type: String,
    description: "Capacité d'accueil",
  },
  duree: {
    type: String,
    description: "Durée de la formation en années",
  },
  annee: {
    type: String,
    description: "Année de la formation (cursus)",
  },
  email: {
    type: String,
    noIndex: true,
    description: "Email du contact pour cette formation",
  },
  parcoursup_reference: {
    type: Boolean,
    description: "La formation est présent sur parcourSup",
  },
  parcoursup_a_charger: {
    type: Boolean,
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
    description: "Statut parcoursup",
  },
  parcoursup_statut_history: {
    type: [Object],
    description: "Parcoursup : historique des statuts",
    noIndex: true,
  },
  parcoursup_error: {
    type: String,
    description: "Erreur lors de la création de la formation sur ParcourSup (via le WS)",
  },
  parcoursup_id: {
    index: true,
    type: String,
    description: "ids ParcourSup",
  },
  affelnet_reference: {
    type: Boolean,
    description: "La formation est présent sur affelnet",
  },
  affelnet_a_charger: {
    type: Boolean,
    description: "**[DEPRECATED]** La formation doit être ajouter à affelnet",
  },
  affelnet_statut: {
    type: String,
    enum: ["hors périmètre", "publié", "non publié", "à publier (soumis à validation)", "à publier", "en attente de publication"],
    description: "Statut affelnet",
  },
  affelnet_statut_history: {
    type: [Object],
    description: "Affelnet : historique des statuts",
    noIndex: true,
  },
  source: {
    type: String,
    description: "Origine de la formation",
  },
  commentaires: {
    type: String,
    description: "Commentaires",
  },
  opcos: {
    type: [String],
    description: "Liste des opcos de la formation",
  },
  info_opcos: {
    type: Number,
    description: "Code du statut de liaison avec un/des opcos",
  },
  info_opcos_intitule: {
    type: String,
    description: "Intitule du statut de liaison avec un/des opcos",
  },
  published: {
    index: true,
    type: Boolean,
    description: "Est publiée, la formation est éligible pour le catalogue",
  },
  rco_published: {
    type: Boolean,
    description: "Est publiée dans le flux rco",
  },
  draft: {
    type: Boolean,
    description: "En cours de creation",
  },
  created_at: {
    type: Date,
    description: "Date d'ajout en base de données",
  },
  updates_history: {
    type: [Object],
    description: "Historique des mises à jours",
    noIndex: true,
  },
  last_update_at: {
    type: Date,
    description: "Date de dernières mise à jour",
  },
  last_update_who: {
    type: String,
    description: "Qui a réalisé la derniere modification",
  },

  // Flags
  to_update: {
    index: true,
    type: Boolean,
    description: "Formation à mette à jour lors du script d'enrichissement",
  },

  update_error: {
    type: String,
    description: "Erreur lors de la mise à jour de la formation",
  },

  lieu_formation_geo_coordonnees: {
    type: String,
    implicit_type: "geo_point",
    description: "Latitude et longitude du lieu de formation",
  },
  lieu_formation_adresse: {
    type: String,
    description: "Adresse du lieu de formation",
  },
  lieu_formation_adresse_computed: {
    type: String,
    description: "Adresse du lieu de formation déduit de la géolocalisation le flux RCO",
  },
  lieu_formation_siret: {
    type: String,
    description: "Siret du lieu de formation",
  },
  id_rco_formation: {
    index: true,
    type: String,
    description: "Id de formation RCO (id_formation + id_action + id_certifinfo)",
  },
  id_formation: {
    index: true,
    type: String,
    description: "Identifiant de la formation",
  },
  id_action: {
    index: true,
    type: String,
    description: "Identifant des actions concaténés",
  },
  ids_action: {
    index: true,
    type: [String],
    description: "Identifant des actions concaténés",
  },
  id_certifinfo: {
    index: true,
    type: String,
    description: "Identifant certifInfo (unicité de la certification)",
  },
  tags: {
    type: [String],
    description: "Tableau de tags (2020, 2021, etc.)",
  },
  libelle_court: {
    type: String,
    description: "BCN : libelle court fusion table n_formation_diplome ou v_formation_diplome",
  },
  niveau_formation_diplome: {
    type: String,
    description: "BCN : niveau formation diplome",
  },
  affelnet_infos_offre: {
    type: String,
    description: "Affelnet : Informations offre de formation",
  },
  affelnet_code_nature: {
    type: String,
    description: "Affelnet : code nature de l'établissement de formation",
  },
  affelnet_secteur: {
    type: String,
    enum: ["PR", "PU", null],
    description: "Affelnet : type d'établissement (PR: Privé / PU: Public)",
  },
  affelnet_raison_depublication: {
    type: String,
    description: "Affelnet : raison de dépublication",
  },
  bcn_mefs_10: {
    type: [Object],
    description: "BCN : Codes MEF 10 caractères",
  },
  editedFields: {
    type: Object,
    description: "Champs édités par un utilisateur",
  },
  parcoursup_raison_depublication: {
    type: String,
    description: "Parcoursup : raison de dépublication",
  },
  distance_lieu_formation_etablissement_formateur: {
    type: Number,
    description: "distance entre le Lieu de formation et l'établissement formateur",
  },
  niveau_entree_obligatoire: {
    type: Number,
    description: "Niveau d'entrée de l'apprenti minimum obligatoire pour cette formation",
  },
  entierement_a_distance: {
    type: Boolean,
    description: "Renseigné si la formation peut être suivie entièrement à distance",
  },
  ...etablissementGestionnaireInfo,
  ...etablissementFormateurInfo,
  ...etablissementReferenceInfo,
}
