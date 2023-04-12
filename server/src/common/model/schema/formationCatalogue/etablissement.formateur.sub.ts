export const etablissementFormateurInfo = {
  etablissement_formateur_id: {
    type: String,
    description: "Identifiant établissement formateur",
  },
  etablissement_formateur_siret: {
    type: String,
    description: "Numéro siret formateur",
  },
  etablissement_formateur_enseigne: {
    type: String,
    description: "Enseigne établissement formateur",
  },
  etablissement_formateur_uai: {
    type: String,
    description: "UAI de l'etablissement formateur",
  },
  etablissement_formateur_type: {
    type: String,
    description: "Etablissement formateur est un CFA ou un OF",
  },
  etablissement_formateur_conventionne: {
    type: String,
    description: "Etablissement formateur est conventionné ou pas",
  },
  etablissement_formateur_declare_prefecture: {
    type: String,
    description: "Etablissement formateur est déclaré en prefecture",
  },
  etablissement_formateur_datadock: {
    type: String,
    description: "Etablissement formateur est connu de datadock",
  },
  etablissement_formateur_published: {
    type: Boolean,
    description: "Etablissement formateur est publié",
  },
  etablissement_formateur_catalogue_published: {
    type: Boolean,
    description: "Etablissement formateur entre dans le catalogue",
  },
  etablissement_formateur_adresse: {
    type: String,
    description: "Numéro et rue établissement formateur",
  },
  etablissement_formateur_code_postal: {
    type: String,
    description: "Code postal établissement formateur",
  },
  etablissement_formateur_code_commune_insee: {
    type: String,
    description: "Code commune insee établissement formateur",
  },
  etablissement_formateur_localite: {
    type: String,
    description: "Localité établissement formateur",
  },
  etablissement_formateur_complement_adresse: {
    type: String,
    description: "Complément d'adresse de l'établissement",
  },
  etablissement_formateur_cedex: {
    type: String,
    description: "Cedex",
  },
  etablissement_formateur_entreprise_raison_sociale: {
    type: String,
    description: "Raison sociale établissement formateur",
  },
  geo_coordonnees_etablissement_formateur: {
    type: String,
    implicit_type: "geo_point",
    description: "Latitude et longitude de l'établissement formateur",
  },
  rncp_etablissement_formateur_habilite: {
    type: Boolean,
    description: "Etablissement formateur est habilité RNCP ou pas",
  },
  etablissement_formateur_region: {
    type: String,
    description: "région formateur",
  },
  etablissement_formateur_num_departement: {
    type: String,
    description: "Numéro de departement formateur",
  },
  etablissement_formateur_nom_departement: {
    type: String,
    description: "Nom du departement formateur",
  },
  etablissement_formateur_nom_academie: {
    type: String,
    description: "Nom de l'académie formateur",
  },
  etablissement_formateur_num_academie: {
    type: String,
    description: "Numéro de l'académie formateur",
  },
  etablissement_formateur_siren: {
    type: String,
    description: "Numéro siren formateur",
  },
  etablissement_formateur_date_creation: {
    type: Date,
    description: "Date de création de l'établissement",
  },
  etablissement_formateur_courriel: {
    type: String,
    description: "Email de l'établissement",
  },
}
