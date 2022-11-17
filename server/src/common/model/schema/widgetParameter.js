export const widgetParameterSchema = {
  id_catalogue: {
    type: String,
    default: null,
    description: "Identifiant d'une formation Catalogue",
  },
  etablissement_siret: {
    type: String,
    default: null,
    description: "Siret formateur",
  },
  formation_intitule: {
    type: String,
    default: null,
    description: "Intitulé long de la formation autorisée",
  },
  code_postal: {
    type: String,
    default: null,
    description: "Code postal du lieu de formation",
  },
  formation_cfd: {
    type: String,
    default: null,
    description: "CFD de la formation autorisée",
  },
  email_rdv: {
    type: String,
    default: null,
    description: "Adresse email pour la prise de RDV",
  },
  is_custom_email_rdv: {
    type: Boolean,
    default: null,
    description: "Spécifie si la synchronisation avec le catalogue ne doit pas écraser l'email_rdv",
  },
  referrers: {
    type: [Object],
    default: [],
    description: "Liste des sites autorisés",
  },
  id_rco_formation: {
    type: String,
    default: null,
    description: "Id RCO formation",
  },
  catalogue_published: {
    type: Boolean,
    default: null,
    description: "Si la formation est publiée sur le Catalogue",
  },
  last_catalogue_sync: {
    type: Date,
    default: Date.now,
    description: "Date de la dernière synchronisation avec le Catalogue",
  },
  id_parcoursup: {
    type: String,
    default: null,
    description: "Identifiant Parcoursup",
  },
  cle_ministere_educatif: {
    type: String,
    default: null,
    description: "Identifiant unique d'une formation",
  },
  etablissement_raison_sociale: {
    type: String,
    default: null,
    description: "Raison sociale de l'établissement",
  },
  etablissement_formateur_adresse: {
    type: String,
    default: null,
    description: "Adresse de l'établissement formateur",
  },
  etablissement_formateur_code_postal: {
    type: String,
    default: null,
    description: "Code postal de l'établissement formateur",
  },
  etablissement_formateur_nom_departement: {
    type: String,
    default: null,
    description: "Département de l'établissement formateur",
  },
  etablissement_formateur_localite: {
    type: String,
    default: null,
    description: "Localité de l'établissement formateur",
  },
  lieu_formation_adresse: {
    type: String,
    default: null,
    description: "Adresse du lieux de formation",
  },
  etablissement_formateur_siret: {
    type: String,
    default: null,
    description: "Siret formateur",
  },
  etablissement_gestionnaire_siret: {
    type: String,
    default: null,
    description: "Siret gestionnaire",
  },
  localite: {
    type: String,
    default: null,
    description: "Localité de la formation",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date de création du document",
  },
}
