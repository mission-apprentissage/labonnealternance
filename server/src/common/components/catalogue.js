import axios from "axios";
import { compose } from "oleoduc";
import queryString from "query-string";
import config from "../../config.js";
import { logger } from "../logger.js";
import { fetchStream } from "../utils/httpUtils.js";
import { streamJsonArray } from "../utils/streamUtils.js";

const neededFieldsFromCatalogue = {
  published: 1,
  catalogue_published: 1,
  intitule_long: 1,
  intitule_court: 1,
  niveau: 1,
  onisep_url: 1,
  cle_ministere_educatif: 1,
  diplome: 1,
  cfd: 1,
  rncp_code: 1,
  rncp_intitule: 1,
  rncp_eligible_apprentissage: 1,
  capacite: 1,
  created_at: 1,
  last_update_at: 1,
  id_formation: 1,
  id_rco_formation: 1,
  email: 1,
  lieu_formation_adresse: 1,
  code_postal: 1,
  localite: 1,
  etablissement_formateur_adresse: 1,
  etablissement_formateur_complement_adresse: 1,
  etablissement_formateur_localite: 1,
  etablissement_formateur_code_postal: 1,
  etablissement_formateur_cedex: 1,
  etablissement_gestionnaire_adresse: 1,
  etablissement_gestionnaire_complement_adresse: 1,
  etablissement_gestionnaire_localite: 1,
  etablissement_gestionnaire_code_postal: 1,
  etablissement_gestionnaire_cedex: 1,
  idea_geo_coordonnees_etablissement: 1,
  num_departement: 1,
  region: 1,
  code_commune_insee: 1,
  etablissement_formateur_entreprise_raison_sociale: 1,
  etablissement_gestionnaire_entreprise_raison_sociale: 1,
  etablissement_formateur_siret: 1,
  etablissement_formateur_id: 1,
  etablissement_formateur_uai: 1,
  etablissement_gestionnaire_id: 1,
  etablissement_gestionnaire_uai: 1,
  etablissement_gestionnaire_siret: 1,
  etablissement_gestionnaire_type: 1,
  etablissement_gestionnaire_conventionne: 1,
  rome_codes: 1,
};

const API = axios.create({ baseURL: `${config.catalogueUrl}` });

const countFormations = async () => {
  try {
    const response = await API.get(`${config.formationsEndPoint}/count`);
    return response.data;
  } catch (error) {
    logger.error(error);
  }
};

const fetchFormations = ({ formationCount }) => {
  const query = { published: true, catalogue_published: true };

  const streamFormations = async (query, options) => {
    const params = convertQueryIntoParams(query, options);
    const response = await fetchStream(`${config.catalogueUrl}${config.formationsEndPoint}.json?${params}`);

    return compose(response, streamJsonArray());
  };

  return streamFormations(query, {
    limit: formationCount,
    select: neededFieldsFromCatalogue,
  });
};

const convertQueryIntoParams = (query, options = {}) => {
  return queryString.stringify(
    {
      query: JSON.stringify(query),
      ...Object.keys(options).reduce((acc, key) => {
        return {
          ...acc,
          [key]: JSON.stringify(options[key]),
        };
      }, {}),
    },
    { encode: false }
  );
};

export { fetchFormations, countFormations };
