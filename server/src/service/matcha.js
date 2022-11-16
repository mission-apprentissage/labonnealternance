import axios from "axios";
import { itemModel } from "../model/itemModel.js";
import config from "../config.js";
import { trackApiCall } from "../common/utils/sendTrackingEvent.js";
import { manageApiError } from "../common/utils/errorManager.js";
import { encryptMailWithIV } from "../common/utils/encryptString.js";
import filterJobsByOpco from "./filterJobsByOpco.js";

const matchaApiEndpoint = `https://matcha${
  config.env === "production" ? "" : "-recette"
}.apprentissage.beta.gouv.fr/api/formulaire`;
const matchaSearchEndPoint = `${matchaApiEndpoint}/search`;
const matchaJobEndPoint = `${matchaApiEndpoint}/offre`;

const coordinatesOfFrance = [2.213749, 46.227638];

import { matchaMock, matchaMockMandataire, matchasMock } from "../mocks/matchas-mock.js";

const getMatchaJobs = async ({ romes, radius, latitude, longitude, api, opco, caller, useMock }) => {
  try {
    const hasLocation = latitude === "" || latitude === undefined ? false : true;

    let distance = hasLocation ? radius || 10 : 21000;

    let params = {
      romes: romes.split(","),
      distance,
      lat: hasLocation ? latitude : coordinatesOfFrance[1],
      lon: hasLocation ? longitude : coordinatesOfFrance[0],
    };

    const jobs = useMock === "true" ? { data: matchasMock } : await axios.post(`${matchaSearchEndPoint}`, params);

    let matchas = transformMatchaJobsForIdea({ jobs: jobs.data, caller });

    // filtrage sur l'opco
    if (opco) {
      matchas.results = await filterJobsByOpco({ opco, jobs: matchas.results });
    }

    if (!hasLocation) {
      sortMatchas(matchas);
    }

    return matchas;
  } catch (error) {
    return manageApiError({ error, api, caller, errorTitle: `getting jobs from Matcha (${api})` });
  }
};

// update du contenu avec des résultats pertinents par rapport au rayon
const transformMatchaJobsForIdea = ({ jobs, caller }) => {
  let resultJobs = {
    results: [],
  };

  if (jobs && jobs.length) {
    for (let i = 0; i < jobs.length; ++i) {
      let companyJobs = transformMatchaJobForIdea({
        job: jobs[i]._source,
        distance: jobs[i].sort[0],
        caller,
      });
      companyJobs.map((job) => resultJobs.results.push(job));
    }
  }

  return resultJobs;
};

const getMatchaJobById = async ({ id, caller }) => {
  try {
    let jobs = null;
    if (id === "id-matcha-test") {
      jobs = { data: matchaMock._source };
    } else if (id === "id-matcha-test2") {
      jobs = { data: matchaMockMandataire._source };
    } else {
      jobs = await axios.get(`${matchaJobEndPoint}/${id}`);
    }
    const job = transformMatchaJobForIdea({
      job: jobs.data,
      caller,
    });

    if (caller) {
      trackApiCall({ caller: caller, nb_emplois: 1, result_count: 1, api: "jobV1/matcha", result: "OK" });
    }

    return { matchas: job };
  } catch (error) {
    return manageApiError({ error, api: "jobV1/matcha", caller, errorTitle: "getting job by id from Matcha" });
  }
};

// Adaptation au modèle Idea et conservation des seules infos utilisées des offres
const transformMatchaJobForIdea = ({ job, distance, caller }) => {
  let resultJobs = [];

  job.offres.map((offre, idx) => {
    let resultJob = itemModel("matcha");

    let email = {};

    email = encryptMailWithIV({ value: job.email, caller });

    resultJob.id = `${job.id_form}-${idx}`;
    resultJob.title = offre.libelle;
    resultJob.contact = {
      ...email,
      name: job.prenom + " " + job.nom,
      phone: job.telephone,
    };

    resultJob.place.distance = distance ? Math.round(10 * distance) / 10 : 0;
    resultJob.place.fullAddress = job.adresse;
    resultJob.place.address = job.adresse;
    resultJob.place.latitude = job.geo_coordonnees.split(",")[0];
    resultJob.place.longitude = job.geo_coordonnees.split(",")[1];

    resultJob.company.siret = job.siret;
    resultJob.company.name = job.enseigne || job.raison_sociale || "Enseigne inconnue";
    resultJob.company.size = job.tranche_effectif;

    resultJob.company.mandataire = job.mandataire;
    resultJob.company.place = { city: job.entreprise_localite };

    resultJob.nafs = [{ label: job.libelle_naf }];
    resultJob.company.mandataire = job.mandataire;
    resultJob.company.creationDate = job.date_creation_etablissement;

    resultJob.diplomaLevel = offre.niveau;
    resultJob.createdAt = job.createdAt;
    resultJob.lastUpdateAt = job.updatedAt;

    resultJob.job = {
      id: offre._id,
      description: offre.description,
      creationDate: job.createdAt,
      contractType: offre.type,
      jobStartDate: offre.date_debut_apprentissage,
      romeDetails: offre.rome_detail,
      rythmeAlternance: offre.rythme_alternance,
      dureeContrat: offre.duree_contrat,
      quantiteContrat: offre.quantite,
      elligibleHandicap: offre.elligible_handicap,
    };

    resultJob.romes = [];
    offre.romes.map((code) => resultJob.romes.push({ code }));

    resultJobs.push(resultJob);
  });

  return resultJobs;
};

const sortMatchas = (matchas) => {
  matchas.results.sort((a, b) => {
    if (a?.title?.toLowerCase() < b?.title?.toLowerCase()) {
      return -1;
    }
    if (a?.title?.toLowerCase() > b?.title?.toLowerCase()) {
      return 1;
    }

    if (a?.company?.name?.toLowerCase() < b?.company?.name?.toLowerCase()) {
      return -1;
    }
    if (a?.company?.name?.toLowerCase() > b?.company?.name?.toLowerCase()) {
      return 1;
    }

    return 0;
  });
};

export { getMatchaJobById, getMatchaJobs };
