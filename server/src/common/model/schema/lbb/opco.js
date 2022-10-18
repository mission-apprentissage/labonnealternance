const opco = {
  siren: {
    type: String,
    default: null,
    description: "Le SIREN d'un ",
    index: true,
    unique: true,
  },
  opco: {
    type: String,
    default: null,
    index: true,
    description: "Nom de l'opco",
  },
  idcc: {
    type: String,
    default: null,
    index: true,
    description: "Identifiant convention collective",
  },
};

module.exports = opco;
