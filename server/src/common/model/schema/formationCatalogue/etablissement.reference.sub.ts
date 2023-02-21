export const etablissementReferenceInfo = {
  etablissement_reference: {
    type: String,
    description: "Etablissement reference est soit formateur soit le gestionnaire",
  },
  etablissement_reference_published: {
    type: Boolean,
    description: "Etablissement reference est publié",
  },
  etablissement_reference_habilite_rncp: {
    type: Boolean,
    description: "Etablissement reference est habilité RNCP ou pas",
  },
  etablissement_reference_certifie_qualite: {
    type: Boolean,
    description: "Etablissement reference est certifié Qualité",
  },
  etablissement_reference_date_creation: {
    type: Date,
    description: "Date de création de l'établissement",
  },
}
