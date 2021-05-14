const axios = require("axios");
const config = require("config");
const Sentry = require("@sentry/node");
const _ = require("lodash");
const { itemModel } = require("../model/itemModel");
const { formationsQueryValidator, formationsRegionQueryValidator } = require("./formationsQueryValidator");
const { trackEvent } = require("../common/utils/sendTrackingEvent");
const crypto = require("crypto");

const formationResultLimit = 500;
const urlCatalogueSearch = `${config.private.catalogueUrl}/api/v1/es/search/convertedformation/_search/`;

const lbfDescriptionUrl = "https://labonneformation.pole-emploi.fr/api/v1/detail";

const publishedMustTerm = {
  match: {
    published: true,
  },
};

const getFormations = async ({ romes, rncps, romeDomain, coords, radius, diploma, limit }) => {
  //console.log(romes, coords, radius, diploma);

  try {
    const distance = radius || 30;

    let mustTerm = [
      romes
        ? {
            match: {
              rome_codes: romes.join(" "),
            },
          }
        : {
            multi_match: {
              query: romeDomain,
              fields: ["rome_codes"],
              type: "phrase_prefix",
              operator: "or",
            },
          },
    ];

    if (rncps) {
      /*
        FIXME: En attente listing des RNCPs à jour
        mustTerm.push({
        match: {
          rncp_code: rncps.join(" "),
        },
      });*/
    }

    if (diploma) {
      mustTerm.push({
        match: {
          niveau: diploma,
        },
      });
    }

    mustTerm.push(publishedMustTerm);

    const esQueryIndexFragment = getFormationEsQueryIndexFragment(limit);

    const body = {
      query: {
        bool: {
          must: mustTerm,
          filter: {
            geo_distance: {
              distance: `${distance}km`,
              idea_geo_coordonnees_etablissement: {
                lat: coords[1],
                lon: coords[0],
              },
            },
          },
        },
      },
      sort: [
        {
          _geo_distance: {
            idea_geo_coordonnees_etablissement: [parseFloat(coords[0]), parseFloat(coords[1])],
            order: "asc",
            unit: "km",
            mode: "min",
            distance_type: "arc",
            ignore_unmapped: true,
          },
        },
      ],
    };

    const responseFormations = await axios.post(urlCatalogueSearch, body, {
      params: esQueryIndexFragment,
    });

    //throw new Error("BOOM");
    let formations = [];

    responseFormations.data.hits.hits.forEach((formation) => {
      formations.push({ source: formation._source, sort: formation.sort, id: formation._id });
    });

    return formations;
  } catch (err) {
    let error_msg = _.get(err, "meta.body", err.message);
    console.error("Error getting trainings from romes ", error_msg);
    if (_.get(err, "meta.meta.connection.status") === "dead") {
      console.error("Elastic search is down or unreachable");
    }
    return { result: "error", error: error_msg, message: error_msg };
  }
};

const getFormation = async ({ id }) => {
  try {
    let mustTerm = [
      {
        match: {
          _id: id,
        },
      },
    ];

    const esQueryIndexFragment = getFormationEsQueryIndexFragment(1);

    const body = {
      query: {
        bool: {
          must: mustTerm,
        },
      },
    };

    const responseFormations = await axios.post(urlCatalogueSearch, body, {
      params: esQueryIndexFragment,
    });

    //throw new Error("BOOM");
    let formations = [];

    responseFormations.data.hits.hits.forEach((formation) => {
      formations.push({ source: formation._source, id: formation._id });
    });

    return formations;
  } catch (err) {
    let error_msg = _.get(err, "meta.body", err.message);
    console.error("Error getting training from id ", error_msg);
    if (_.get(err, "meta.meta.connection.status") === "dead") {
      console.error("Elastic search is down or unreachable");
    }
    return { result: "error", error: error_msg, message: error_msg };
  }
};

// Charge la formation ayant l'id en paramètre
const getOneFormationFromId = async ({ id }) => {
  try {
    let formation = [];

    formation = await getFormation({
      id,
    });

    if (!formation.error) {
      formation = transformFormationsForIdea(formation);
    }

    return formation;
  } catch (error) {
    let errorObj = { result: "error", message: error.message };

    Sentry.captureException(error);

    if (error.response) {
      errorObj.status = error.response.status;
      errorObj.statusText = error.response.statusText;
    }

    console.error("error get Training", errorObj);

    return errorObj;
  }
};

const getRegionFormations = async ({
  romes,
  romeDomain,
  region,
  departement,
  diploma,
  limit = formationResultLimit,
}) => {
  //console.log(romes, coords, radius, diploma);

  try {
    let mustTerm = [];

    if (departement)
      mustTerm.push({
        multi_match: {
          query: departement,
          fields: ["code_postal"],
          type: "phrase_prefix",
          operator: "or",
        },
      });

    if (region) mustTerm.push(getEsRegionTermFragment(region));

    if (romes)
      mustTerm.push({
        match: {
          rome_codes: romes.join(" "),
        },
      });

    if (romeDomain)
      mustTerm.push({
        multi_match: {
          query: romeDomain,
          fields: ["rome_codes"],
          type: "phrase_prefix",
          operator: "or",
        },
      });

    if (diploma)
      mustTerm.push({
        match: {
          niveau: diploma,
        },
      });

    mustTerm.push(publishedMustTerm);

    const esQueryIndexFragment = getFormationEsQueryIndexFragment(limit);

    const body = {
      query: {
        bool: {
          must: mustTerm,
        },
      },
    };

    const responseFormations = await axios.post(urlCatalogueSearch, body, {
      params: esQueryIndexFragment,
    });

    let formations = [];

    responseFormations.data.hits.hits.forEach((formation) => {
      formations.push({ source: formation._source, sort: formation.sort, id: formation._id });
    });

    return formations;
  } catch (err) {
    Sentry.captureException(err);
    let error_msg = _.get(err, "meta.body", err.message);
    console.error("Error getting trainings from romes ", error_msg);
    if (_.get(err, "meta.meta.connection.status") === "dead") {
      console.error("Elastic search is down or unreachable");
    }
    return { error: error_msg };
  }
};

// tente de récupérer des formatiosn dans le rayon de recherche, si sans succès cherche les maxOutLimitFormation les plus proches du centre de recherche
const getAtLeastSomeFormations = async ({
  romes,
  rncps,
  romeDomain,
  coords,
  radius,
  diploma,
  maxOutLimitFormation,
}) => {
  try {
    let formations = [];
    let currentRadius = radius;
    let formationLimit = formationResultLimit;

    formations = await getFormations({
      romes,
      rncps,
      romeDomain,
      coords,
      radius: currentRadius,
      diploma,
      limit: formationLimit,
    });

    // si pas de résultat on étend le rayon de recherche et on réduit le nombre de résultats autorisés
    if (formations instanceof Array && formations.length === 0) {
      formationLimit = maxOutLimitFormation; // limite réduite car extension au delà du rayon de recherche
      currentRadius = 20000;
      formations = await getFormations({
        romes,
        rncps,
        romeDomain,
        coords,
        radius: currentRadius,
        diploma,
        limit: formationLimit,
      });
    }

    if (!formations.error) {
      formations = deduplicateFormations(formations);

      //throw new Error("BANG");
      formations = transformFormationsForIdea(formations);
    }

    return formations;
  } catch (error) {
    let errorObj = { result: "error", message: error.message };

    Sentry.captureException(error);

    if (error.response) {
      errorObj.status = error.response.status;
      errorObj.statusText = error.response.statusText;
    }

    console.error("error get Trainings", errorObj);

    return errorObj;
  }
};

const deduplicateFormations = (formations) => {
  if (formations instanceof Array && formations.length > 0) {
    return formations.reduce((acc, formation) => {
      const found = acc.find((f) => {
        return (
          f.source.intitule_long === formation.source.intitule_long &&
          f.source.intitule_court === formation.source.intitule_court &&
          f.source.etablissement_formateur_siret === formation.source.etablissement_formateur_siret &&
          f.source.diplome === formation.source.diplome &&
          f.source.code_postal === formation.source.code_postal
        );
      });

      if (!found) {
        acc = [...acc, formation];
      }

      return acc;
    }, []);
  } else {
    return formations;
  }
};

const transformFormationsForIdea = (formations) => {
  let resultFormations = {
    results: [],
  };

  if (formations.length) {
    for (let i = 0; i < formations.length; ++i) {
      resultFormations.results.push(transformFormationForIdea(formations[i]));
    }
  }

  return resultFormations;
};

// Adaptation au modèle Idea et conservation des seules infos utilisées des offres
const transformFormationForIdea = (formation) => {
  let resultFormation = itemModel("formation");

  resultFormation.title = _.get(formation, "source.intitule_long", formation.source.intitule_court);
  resultFormation.title += " --- " + formation.source.nom + " --- " + formation.source.code_commune_insee;
  resultFormation.longTitle = formation.source.intitule_long;
  resultFormation.diplomaLevel = formation.source.niveau;
  resultFormation.onisepUrl = formation.source.onisep_url;
  resultFormation.id = formation.id;
  resultFormation.diploma = formation.source.diplome;
  resultFormation.cfd = formation.source.cfd;
  resultFormation.rncpCode = formation.source.rncp_code;
  resultFormation.rncpLabel = formation.source.rncp_intitule;
  resultFormation.rncpEligibleApprentissage = formation.source.rncp_eligible_apprentissage;
  resultFormation.period = formation.source.periode;
  resultFormation.capacity = formation.source.capacite;
  resultFormation.createdAt = formation.source.created_at;
  resultFormation.lastUpdateAt = formation.source.last_update_at;
  resultFormation.idRco = formation.source.id_rco_formation ? formation.source.id_rco_formation.split("|")[0] : "";
  resultFormation.idRcoFormation = formation.source.id_rco_formation;

  if (formation.source.email) {
    resultFormation.contact = {
      email: formation.source.email,
    };
  }

  resultFormation.place = {
    distance: formation.sort ? formation.sort[0] : null,
    fullAddress: getTrainingAddress(formation.source), // adresse postale reconstruite à partir des éléments d'adresse fournis
    latitude: formation.source.idea_geo_coordonnees_etablissement
      ? formation.source.idea_geo_coordonnees_etablissement.split(",")[0]
      : null,
    longitude: formation.source.idea_geo_coordonnees_etablissement
      ? formation.source.idea_geo_coordonnees_etablissement.split(",")[1]
      : null,
    //city: formation.source.etablissement_formateur_localite,
    city: formation.source.localite,
    address: `${formation.source.lieu_formation_adresse}`,
    cedex: formation.source.etablissement_formateur_cedex,
    zipCode: formation.source.code_postal,
    //trainingZipCode: formation.source.code_postal,
    departementNumber: formation.source.num_departement,
    region: formation.source.region,
  };

  resultFormation.company = {
    name: getTrainingSchoolName(formation.source), // pe -> entreprise.nom | formation -> etablissement_formateur_entreprise_raison_sociale | lbb/lba -> name
    siret: formation.source.etablissement_formateur_siret,
    id: formation.source.etablissement_formateur_id,
    uai: formation.source.etablissement_formateur_uai,
    headquarter: {
      // uniquement pour formation
      id: formation.source.etablissement_gestionnaire_id,
      uai: formation.source.etablissement_gestionnaire_uai,
      type: formation.source.etablissement_gestionnaire_type,
      hasConvention: formation.source.etablissement_gestionnaire_conventionne,
      place: {
        address: `${formation.source.etablissement_gestionnaire_adresse}${
          formation.source.etablissement_gestionnaire_complement_adresse
            ? ", " + formation.source.etablissement_gestionnaire_complement_adresse
            : ""
        }`,
        cedex: formation.source.etablissement_gestionnaire_cedex,
        zipCode: formation.source.etablissement_gestionnaire_code_postal,
        city: formation.source.etablissement_gestionnaire_localite,
      },
      name: formation.source.etablissement_gestionnaire_entreprise_raison_sociale,
    },
    place: {
      city: formation.source.etablissement_formateur_localite,
    },
  };

  if (formation.source.rome_codes && formation.source.rome_codes.length) {
    resultFormation.romes = [];

    formation.source.rome_codes.forEach((rome) => resultFormation.romes.push({ code: rome }));
  }

  return resultFormation;
};

const getTrainingAddress = (school) => {
  let schoolAddress = "";

  if (school.lieu_formation_adresse) {
    schoolAddress = `${school.lieu_formation_adresse} ${school.code_postal} ${school.localite}`;
  } else {
    schoolAddress = school.etablissement_formateur_adresse
      ? `${school.etablissement_formateur_adresse}${
          school.etablissement_formateur_complement_adresse
            ? `, ${school.etablissement_formateur_complement_adresse}`
            : ""
        } ${school.etablissement_formateur_localite ? school.etablissement_formateur_localite : ""} ${
          school.etablissement_formateur_code_postal ? school.etablissement_formateur_code_postal : ""
        }${school.etablissement_formateur_cedex ? ` CEDEX ${school.etablissement_formateur_cedex}` : ""}
        `
      : `${school.etablissement_gestionnaire_adresse}${
          school.etablissement_gestionnaire_complement_adresse
            ? `, ${school.etablissement_gestionnaire_complement_adresse}`
            : ""
        } ${school.etablissement_gestionnaire_localite ? school.etablissement_gestionnaire_localite : ""} ${
          school.etablissement_gestionnaire_code_postal ? school.etablissement_gestionnaire_code_postal : ""
        }${school.etablissement_gestionnaire_cedex ? ` CEDEX ${school.etablissement_gestionnaire_cedex}` : ""}
        `;
  }
  return schoolAddress;
};

const getTrainingSchoolName = (school) => {
  let schoolName = school.etablissement_formateur_entreprise_raison_sociale
    ? school.etablissement_formateur_entreprise_raison_sociale
    : school.etablissement_gestionnaire_entreprise_raison_sociale;

  schoolName += " ---- " + school.etablissement_formateur_enseigne;

  return schoolName;
};

const getFormationsQuery = async (query) => {
  //console.log("query : ", query);

  const queryValidationResult = formationsQueryValidator(query);

  if (queryValidationResult.error) return queryValidationResult;

  if (query.caller) {
    trackEvent({ category: "Appel API", action: "formationV1", label: query.caller });
  }

  try {
    const formations = await getAtLeastSomeFormations({
      romes: query.romes ? query.romes.split(",") : null,
      rncps: query.rncps ? query.rncps.split(",") : null,
      coords: [query.longitude, query.latitude],
      radius: query.radius,
      diploma: query.diploma,
      maxOutLimitFormation: 5,
      romeDomain: query.romeDomain,
    });

    //throw new Error("BIG BANG");
    return formations;
  } catch (err) {
    console.error("Error ", err.message);
    Sentry.captureException(err);
    return { error: "internal_error" };
  }
};

const getFormationQuery = async (query) => {
  if (query.caller) {
    trackEvent({ category: "Appel API", action: "formationV1", label: query.caller });
  }

  try {
    const formation = await getOneFormationFromId({
      id: query.id,
    });

    //throw new Error("BIG BANG");
    return formation;
  } catch (err) {
    console.error("Error ", err.message);
    Sentry.captureException(err);
    return { error: "internal_error" };
  }
};

const getLbfQueryParams = (params) => {
  // le timestamp doit être uriencodé avec le format ISO sans les millis
  let date = new Date().toISOString();
  date = encodeURIComponent(date.substring(0, date.lastIndexOf(".")));

  let queryParams = `user=LBA&uid=${params.id}&timestamp=${date}`;

  var hmac = crypto.createHmac("md5", config.private.laBonneFormationPassword);
  const data = hmac.update(queryParams);
  const signature = data.digest("hex");

  // le param signature doit contenir un hash des autres params chiffré avec le mdp attribué à LBA
  queryParams += "&signature=" + signature;

  return queryParams;
};

const getFormationDescriptionQuery = async (params) => {
  try {
    const formationDescription = await axios.get(`${lbfDescriptionUrl}?${getLbfQueryParams(params)}`);

    return formationDescription.data;
  } catch (err) {
    console.error("Error ", err.message);
    Sentry.captureException(err);
    return { error: "internal_error" };
  }
};

const getFormationsParRegionQuery = async (query) => {
  //console.log("query : ", query);

  const queryValidationResult = formationsRegionQueryValidator(query);

  if (queryValidationResult.error) return queryValidationResult;

  if (query.caller) {
    trackEvent({ category: "Appel API", action: "formationRegionV1", label: query.caller });
  }

  try {
    let formations = await getRegionFormations({
      romes: query.romes ? query.romes.split(",") : null,
      region: query.region,
      departement: query.departement,
      diploma: query.diploma,
      romeDomain: query.romeDomain,
    });

    formations = transformFormationsForIdea(formations);

    sortFormations(formations);

    //throw new Error("BIG BANG");
    return formations;
  } catch (err) {
    console.error("Error ", err.message);
    Sentry.captureException(err);
    return { error: "internal_error" };
  }
};

const getFormationEsQueryIndexFragment = (limit) => {
  return {
    //index: "mnaformation",
    index: "convertedformation",
    size: limit,
    _sourceIncludes: [
      "etablissement_formateur_siret",
      "onisep_url",
      "_id",
      "email",
      "niveau",
      "idea_geo_coordonnees_etablissement",
      "intitule_long",
      "intitule_court",
      "lieu_formation_adresse",
      "localite",
      "code_postal",
      "num_departement",
      "region",
      "diplome",
      "created_at",
      "last_update_at",
      "etablissement_formateur_id",
      "etablissement_formateur_uai",
      "etablissement_formateur_adresse",
      "etablissement_formateur_code_postal",
      "etablissement_formateur_localite",
      "etablissement_formateur_entreprise_raison_sociale",
      "etablissement_formateur_enseigne",
      "etablissement_formateur_cedex",
      "etablissement_formateur_complement_adresse",
      "etablissement_gestionnaire_id",
      "etablissement_gestionnaire_uai",
      "etablissement_gestionnaire_conventionne",
      "etablissement_gestionnaire_type",
      "etablissement_gestionnaire_adresse",
      "etablissement_gestionnaire_code_postal",
      "etablissement_gestionnaire_localite",
      "etablissement_gestionnaire_entreprise_raison_sociale",
      "etablissement_gestionnaire_cedex",
      "etablissement_gestionnaire_complement_adresse",
      "rome_codes",
      "cfd",
      "rncp_code",
      "rncp_intitule",
      "rncp_eligible_apprentissage",
      "periode",
      "capacite",
      "id_rco_formation",
      "code_commune_insee",
      "nom",
    ],
  };
};

const { regionCodeToDepartmentList } = require("../common/utils/regionInseeCodes");
const getEsRegionTermFragment = (region) => {
  let departements = [];

  regionCodeToDepartmentList[region].forEach((departement) => {
    departements.push({
      multi_match: {
        query: departement,
        fields: ["code_postal"],
        type: "phrase_prefix",
        operator: "or",
      },
    });
  });

  return {
    bool: {
      should: departements,
    },
  };
};

const sortFormations = (formations) => {
  formations.results.sort((a, b) => {
    if (a.company.name < b.company.name) {
      return -1;
    }
    if (a.company.name > b.company.name) {
      return 1;
    }

    if (a.title < b.title) {
      return -1;
    }
    if (a.title > b.title) {
      return 1;
    }

    return 0;
  });
};

module.exports = {
  getFormationsQuery,
  getFormationQuery,
  getFormationsParRegionQuery,
  transformFormationsForIdea,
  getFormations,
  deduplicateFormations,
  getFormationDescriptionQuery,
};
