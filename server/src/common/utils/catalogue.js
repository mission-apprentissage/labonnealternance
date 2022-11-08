import axios from "axios";
import rax from "retry-axios";
import config from "../../config.js";

// Retry calls 3 times.
rax.attach();

/**
 * @description Get formations by its identifier.
 * @param {String} id
 * @returns {Promise<Object[]>}
 */
const getFormationsById = ({ id }) =>
  getFormations({
    $and: [{ _id: id }],
  });

/**
 * @description Get formations by "siret formateur" with "common conditions".
 * @param {String} siretFormateur
 * @returns {Promise<Object[]>}
 */
const getFormationsBySiretFormateur = ({ siretFormateur }) =>
  getFormations({
    $and: [{ etablissement_formateur_siret: siretFormateur }],
  });

/**
 * @description Get formations by idRcoFormations with "common conditions".
 * @param {String[]} idRcoFormations
 * @returns {Promise<Object[]>}
 */
const getFormationsByIdRcoFormations = ({ idRcoFormations }) =>
  getFormations({
    $and: [{ id_rco_formation: idRcoFormations }],
  });

/**
 * @description Get formations by idRcoFormations.
 * @param {String[]} idRcoFormations
 * @returns {Promise<Object[]>}
 */
const getFormationsByIdRcoFormationsRaw = ({ idRcoFormations }) =>
  getFormations({
    $and: [{ id_rco_formation: idRcoFormations }],
  });

/**
 * @description Get formations by its idParcoursup.
 * @param {String} idParcoursup
 * @returns {Promise<Object[]>}
 */
const getFormationsByIdParcoursup = ({ idParcoursup }) =>
  getFormations({
    id_parcoursup: idParcoursup,
  });

/**
 * @description Get formations through the catalogue.
 * @param {Object} query - Mongo query
 * @param {Number} page - For pagination
 * @param {Number} limit - Item limit
 * @returns {Promise<Object>}
 */
const getFormations = async (query, page = 1, limit = 500) => {
  const { data } = await axios.post(`${config.catalogueUrl}/api/v1/entity/formations`, {
    query,
    select: {
      _id: 1,
      code_postal: 1,
      id_rco_formation: 1,
      etablissement_formateur_entreprise_raison_sociale: 1,
      etablissement_gestionnaire_courriel: 1,
      etablissement_formateur_courriel: 1,
      intitule_long: 1,
      etablissement_formateur_adresse: 1,
      etablissement_formateur_code_postal: 1,
      etablissement_formateur_nom_departement: 1,
      etablissement_formateur_localite: 1,
      lieu_formation_adresse: 1,
      etablissement_formateur_siret: 1,
      etablissement_gestionnaire_siret: 1,
      cfd: 1,
      localite: 1,
      email: 1,
      published: 1,
      parcoursup_id: 1,
      cle_ministere_educatif: 1,
    },
    page,
    limit,
  });

  return data;
};

export {
  getFormationsByIdRcoFormations,
  getFormationsByIdRcoFormationsRaw,
  getFormationsByIdParcoursup,
  getFormationsBySiretFormateur,
  getFormationsById,
  getFormations,
};
