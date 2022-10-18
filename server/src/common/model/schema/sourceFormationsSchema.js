const sourceFormationsSchema = {
  currentIndex: {
    type: String,
    default: null,
    description:
      "Base de données source des formations derrière l'alias convertedformations. convertedformation_0 OU convertedformation_1",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date d'ajout en base de données",
  },
  last_update_at: {
    type: Date,
    default: Date.now,
    description: "Date de dernières mise à jour",
  },
};

module.exports = sourceFormationsSchema;
