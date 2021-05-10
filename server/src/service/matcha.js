const axios = require("axios");
const Sentry = require("@sentry/node");
const { itemModel } = require("../model/itemModel");

const matchaApiEndpoint = "https://matcha.apprentissage.beta.gouv.fr/api/formulaire";
const matchaSearchEndPoint = `${matchaApiEndpoint}/search`;
const matchaJobEndPoint = `${matchaApiEndpoint}/offre`;

const getMatchaJobs = async ({ romes, radius, latitude, longitude }) => {
  try {
    const distance = radius || 10;

    let params = {
      romes: romes.split(","),
      distance,
      lat: latitude,
      lon: longitude,
    };

    const jobs = await axios.post(`${matchaSearchEndPoint}`, params);

    return transformMatchaJobsForIdea(jobs.data, radius, latitude, longitude);
  } catch (error) {
    let errorObj = { result: "error", message: error.message };

    Sentry.captureException(error);

    if (error.response) {
      errorObj.status = error.response.status;
      errorObj.statusText = error.response.statusText;
    }

    console.log("error get Matcha Jobs", errorObj);

    return errorObj;
  }
};

// update du contenu avec des résultats pertinents par rapport au rayon
const transformMatchaJobsForIdea = (jobs) => {
  let resultJobs = {
    results: [],
  };

  if (jobs && jobs.length) {
    for (let i = 0; i < jobs.length; ++i) {
      let companyJobs = transformMatchaJobForIdea(jobs[i]._source, jobs[i].sort[0]);
      companyJobs.map((job) => resultJobs.results.push(job));
    }
  }

  return resultJobs;
};

const getMatchaJobById = async ({ id }) => {
  try {
    const jobs = await axios.get(`${matchaJobEndPoint}/${id}`);
    const job = transformMatchaJobForIdea(jobs.data);

    return { matchas: job };
  } catch (error) {
    let errorObj = { result: "error", message: error.message };

    Sentry.captureException(error);

    if (error.response) {
      errorObj.status = error.response.status;
      errorObj.statusText = error.response.statusText;
    }

    console.log("error getting Matcha Job by id", errorObj);

    return errorObj;
  }
};

// Adaptation au modèle Idea et conservation des seules infos utilisées des offres
const transformMatchaJobForIdea = (job, distance) => {
  let resultJobs = [];

  job.offres.map((offre, idx) => {
    let resultJob = itemModel("matcha");
    resultJob.id = `${job.id_form}-${idx}`;
    resultJob.title = offre.libelle;
    resultJob.contact = {
      email: job.email,
      name: job.prenom + " " + job.nom,
      phone: job.telephone,
    };

    resultJob.place.distance = Math.round(10 * distance) / 10;
    resultJob.place.fullAddress = job.adresse;
    resultJob.place.address = job.adresse;
    resultJob.place.latitude = job.geo_coordonnees.split(",")[0];
    resultJob.place.longitude = job.geo_coordonnees.split(",")[1];

    resultJob.company.siret = job.siret;
    resultJob.company.name = job.raison_sociale;

    resultJob.diplomaLevel = offre.niveau;
    resultJob.createdAt = job.createdAt;
    resultJob.lastUpdateAt = job.updatedAt;

    resultJob.job = {
      id: offre._id,
      description: offre.description,
      creationDate: job.createdAt,
    };

    resultJob.romes = [];
    offre.romes.map((code) => resultJob.romes.push({ code }));

    resultJobs.push(resultJob);
  });

  return resultJobs;
};

module.exports = { getMatchaJobById, getMatchaJobs };
