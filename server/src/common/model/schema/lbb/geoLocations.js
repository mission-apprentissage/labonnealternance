const geoLocationSchema = {
  address: {
    type: String,
    default: null,
    description: "L'adresse d'un établissement",
    index: true,
    unique: true,
  },
  city: {
    type: String,
    default: null,
    description: "Ville",
  },
  postcode: {
    type: String,
    default: null,
    description: "Code postal",
  },
  geoLocation: {
    type: String,
    default: null,
    description: "Les coordonnées latitude et longitude",
  },
};

module.exports = geoLocationSchema;
