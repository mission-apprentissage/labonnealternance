import Sentry from "@sentry/node";
import axios from "axios";
import config from "../../config.js";
import { etat_etablissements } from "../constants.js";
import { ReferentielOpco, UserRecruteur } from "../model/index.js";

const apiParams = {
  token: config.apiEntrepriseKey,
  context: "Matcha MNA",
  recipient: "12000101100010", // Siret Dinum
  object: "Consolidation des données",
};

const getEffectif = (code) => {
  switch (code) {
    case "00":
      return "0 salarié";

    case "01":
      return "1 ou 2 salariés";

    case "02":
      return "3 à 5 salariés";

    case "03":
      return "6 à 9 salariés";

    case "11":
      return "10 à 19 salariés";

    case "12":
      return "20 à 49 salariés";

    case "21":
      return "50 à 99 salariés";

    case "22":
      return "100 à 199 salariés";

    case "31":
      return "200 à 249 salariés";

    case "32":
      return "250 à 499 salariés";

    case "41":
      return "500 à 999 salariés";

    case "42":
      return "1 000 à 1 999 salariés";

    case "51":
      return "2 000 à 4 999 salariés";

    case "52":
      return "5 000 à 9 999 salariés";

    case "53":
      return "10 000 salariés et plus";

    default:
      return "";
  }
};

export default () => ({
  getEtablissement: (query) => UserRecruteur.findOne(query),
  getOpco: (siret) => axios.get(`https://www.cfadock.fr/api/opcos?siret=${siret}`),
  getOpcoByIdcc: (idcc) => axios.get(`https://www.cfadock.fr/api/opcos?idcc=${idcc}`),
  getIdcc: (siret) => axios.get(`https://siret2idcc.fabrique.social.gouv.fr/api/v2/${siret}`),
  getValidationUrl: (_id) => `${config.publicUrl}/authentification/validation/${_id}`,
  validateEtablissementEmail: async (_id) => {
    let exist = await UserRecruteur.findById(_id);

    if (!exist) {
      return false;
    }

    await UserRecruteur.findByIdAndUpdate(_id, { email_valide: true });

    return true;
  },
  getEtablissementFromGouv: async (siret) => {
    try {
      const result = await axios.get(`https://entreprise.api.gouv.fr/v2/etablissements/${siret}`, {
        params: apiParams,
      });

      return result;
    } catch (error) {
      Sentry.captureException(error);
      return { error: true };
    }
  },
  getEtablissementFromReferentiel: async (siret) => {
    try {
      const response = await axios.get(`https://referentiel.apprentissage.beta.gouv.fr/api/v1/organismes/${siret}`);
      return response;
    } catch (error) {
      Sentry.captureException(error);
      if (error.response.status === 404) {
        return null;
      }
    }
  },
  getEtablissementFromCatalogue: async (siret) => {
    try {
      const result = await axios.get("https://catalogue.apprentissage.beta.gouv.fr/api/v1/entity/etablissements/", {
        params: {
          query: { siret },
        },
      });
      return result;
    } catch (error) {
      Sentry.captureException(error);
      return error;
    }
  },
  getGeoCoordinates: async (adresse) => {
    try {
      const response = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${adresse}`);
      const coordinates = response.data.features[0]
        ? response.data.features[0].geometry.coordinates.reverse().join(",")
        : "NOT FOUND";
      return coordinates;
    } catch (error) {
      Sentry.captureException(error);
      return error;
    }
  },
  getEstablishmentFromOpcoReferentiel: (opco_label, siret_code, email) =>
    ReferentielOpco.findOne({ opco_label, siret_code, emails: { $in: [email] } }),
  formatEntrepriseData: (d) => ({
    enseigne: d.enseigne,
    etat: d.etat_administratif.value, // F pour fermé ou A pour actif
    siret: d.siret,
    raison_sociale: d.adresse.l1,
    adresse: `${d.adresse.l4 ?? ""} ${d.adresse.code_postal} ${d.adresse.localite}`,
    rue: d.adresse.l4,
    commune: d.adresse.localite,
    code_postal: d.adresse.code_postal,
    contacts: [], // conserve la coherence avec l'UI
    code_naf: d.naf,
    libelle_naf: d.libelle_naf,
    tranche_effectif: d.tranche_effectif_salarie_etablissement.intitule,
    date_creation_etablissement: new Date(d.date_creation_etablissement),
  }),
  formatEntrepriseDatav3: (d) => ({
    etat: d.unite_legale.etat_administratif, // F pour fermé ou A pour actif
    siret: d.siret,
    raison_sociale: d.denomination_usuelle ?? d.unite_legale.denomination,
    adresse: d.geo_adresse,
    rue: d.geo_l4,
    commune: d.libelle_commune,
    code_postal: d.code_postal,
    contacts: [], // conserve la coherence avec l'UI
    code_naf: d.activite_principale,
    libelle_naf: d.libelle_naf ?? "",
    tranche_effectif: getEffectif(d.tranche_effectifs),
    date_creation_etablissement: new Date(d.date_creation),
  }),
  formatReferentielData: (d) => ({
    etat: d.etat_administratif,
    qualiopi: d.qualiopi,
    siret: d.siret,
    raison_sociale: d.raison_sociale,
    contacts: d.contacts,
    adresse: d.adresse?.label,
    rue:
      d.adresse?.label?.split(`${d.adresse?.code_postal}`)[0].trim() ||
      d.lieux_de_formation[0].adresse.label.split(`${d.lieux_de_formation[0].adresse.code_postal}`)[0].trim(),
    commune: d.adresse?.localite || d.lieux_de_formation[0].adresse.localite,
    code_postal: d.adresse?.code_postal || d.lieux_de_formation[0].adresse.code_postal,
    geo_coordonnees: d.adresse
      ? `${d.adresse?.geojson.geometry.coordinates[1]},${d.adresse?.geojson.geometry.coordinates[0]}`
      : `${d.lieux_de_formation[0].adresse.geojson?.geometry.coordinates[0]},${d.lieux_de_formation[0].adresse.geojson?.geometry.coordinates[1]}`,
  }),
  formatCatalogueData: (d) => ({
    etat: d.ferme === false ? etat_etablissements.FERME : etat_etablissements.ACTIF,
    siret: d.siret,
    raison_sociale: d.entreprise_raison_sociale,
    contacts: [], // les tco n'ont pas d'information de contact, mais conserve un standard pour l'ui,
    commune: d.localite,
    code_postal: d.code_postal,
    adresse: `${d.numero_voie === null ? "" : d.numero_voie} ${d.type_voie} ${d.nom_voie} ${d.code_postal} ${
      d.localite
    }`,
    rue: `${d.numero_voie === null ? "" : d.numero_voie} ${d.type_voie} ${d.nom_voie}`,
    geo_coordonnees: d.geo_coordonnees,
  }),
});
