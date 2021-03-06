const {
  validateRomes,
  validateRadius,
  validateLatitude,
  validateLongitude,
  validateInsee,
  validateApiSources,
  validateCaller,
} = require("../queryValidators");

const jobsQueryValidator = (query) => {
  let error_messages = [];

  // contrôle des paramètres

  // présence d'identifiant de la source : caller
  validateCaller({ caller: query.caller, referer: query.referer }, error_messages);

  // codes ROME : romes
  validateRomes(query.romes, error_messages);

  // rayon de recherche : radius
  validateRadius(query.radius, error_messages);

  // coordonnées gps : latitude et longitude
  validateLatitude(query.latitude, error_messages);
  validateLongitude(query.longitude, error_messages);

  // code INSEE : insee
  if (query.caller) {
    validateInsee(query.insee, error_messages);
  }

  // source mal formée si présente
  validateApiSources(query.sources, error_messages, ["lbb", "lba", "offres", "matcha"]);

  // strictRadius devient valeur par défaut, l'inverse doit être explicite

  if (error_messages.length) return { error: "wrong_parameters", error_messages };

  return { result: "passed" };
};

module.exports = { jobsQueryValidator };
