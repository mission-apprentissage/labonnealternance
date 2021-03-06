const localOrigin = [
  "https://labonnealternance-recette.apprentissage.beta.gouv.fr",
  "https://labonnealternance.apprentissage.beta.gouv.fr",
  "https://labonnealternance.beta.pole-emploi.fr",
  "https://labonnealternance.pole-emploi.fr",
  "http://localhost:3003",
  "http://localhost:3000", //TODO: temporaire jusqu'à suppression de :3000
];

const isOriginLocal = (origin) => {
  if (origin) {
    if (
      localOrigin.findIndex((element) => origin.toLowerCase().includes(element)) >= 0 &&
      origin.indexOf("api-docs") < 0
    ) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
};

module.exports = { isOriginLocal };
