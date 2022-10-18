const etablissementReferenceInfo = {
  etablissement_reference: {
    type: String,
    default: null,
    description: "Etablissement reference  est soit formateur soit le gestionnaire",
  },
  etablissement_reference_type: {
    type: String,
    default: null,
    description: "Etablissement reference est un CFA ou un OF",
  },
  etablissement_reference_conventionne: {
    type: String,
    default: null,
    description: "Etablissement reference est conventionné ou pas",
  },
  etablissement_reference_declare_prefecture: {
    type: String,
    default: null,
    description: "Etablissement reference est déclaré en prefecture",
  },
  etablissement_reference_datadock: {
    type: String,
    default: null,
    description: "Etablissement reference est connu de datadock",
  },
  etablissement_reference_published: {
    type: Boolean,
    default: false,
    description: "Etablissement reference est publié",
  },
  etablissement_reference_catalogue_published: {
    type: Boolean,
    default: false,
    description: "Etablissement reference entre dans le catalogue",
  },
  rncp_etablissement_reference_habilite: {
    type: Boolean,
    default: false,
    description: "Etablissement reference est habilité RNCP ou pas",
  },
  etablissement_reference_date_creation: {
    type: Date,
    default: null,
    description: "Date de création de l'établissement",
  },
};

module.exports = etablissementReferenceInfo;
