const distance = require("@turf/distance");
const axios = require("axios");
const Sentry = require("@sentry/node");
const { itemModel } = require("../../model/itemModel");

//const poleEmploi = require("./common.js");
const { getAccessToken, peApiHeaders, getRoundedRadius } = require("./common.js");

const getSomePeJobs = async ({ romes, insee, radius, lat, long, strictRadius }) => {
  // la liste des romes peut être supérieure au maximum de trois autorisés par l'api offre de PE
  // on segmente les romes en blocs de max 3 et lance autant d'appels parallèles que nécessaires
  let chunkedRomes = [];
  let i = 0,
    k = 0;
  while (i < romes.length) {
    chunkedRomes[k] = romes.slice(i, i + 3).join(",");
    i += 3;
    ++k;
  }

  const jobs = await Promise.all(
    chunkedRomes.map(async (chunk) => {
      const res = await getSomePeJobsForChunkedRomes({ romes: chunk, insee, radius, lat, long, strictRadius });
      return res;
    })
  );

  // à ce stade nous avons plusieurs résultats de l'appel à l'api offres
  // il faut fusionner les résultats des différents appels
  for (let j = 0; j < jobs.length; ++j) {
    if (j !== 0) {
      if (!jobs[0].results) {
        // si une erreur sur le premier bloc on le remplace par un bloc subséquent (qui peut être en erreur également)
        jobs[0] = jobs[j];
      } else {
        if (jobs[j].results) {
          // si aucune erreur sur le premier bloc et le bloc en court on procède à la concaténation des deux
          jobs[0].results = jobs[0].results.concat(jobs[j].results);
        }
        // else le bloc courant est en erreur on ne fait rien
      }
    }
  }

  // tri du résultat fusionné sur le critère de poids descendant
  if (jobs[0].results) {
    jobs[0].results.sort((a, b) => {
      return b.place.distance - a.place.distance;
    });
  }

  return jobs[0];
};

// appel de l'api offres pour un bloc de 1 à 3 romes
const getSomePeJobsForChunkedRomes = async ({ romes, insee, radius, lat, long, strictRadius }) => {
  let jobResult = null;
  let currentRadius = strictRadius ? radius : 20000;
  let jobLimit = 50; //TODO: query params options or default value from properties -> size || 50

  let trys = 0;

  while (trys < 3) {
    jobResult = await getPeJobs(romes, insee, currentRadius, jobLimit);

    if (jobResult.status === 429) {
      console.log("PE jobs api quota exceeded. Retrying : ", trys + 1);
      // trois essais pour gérer les 429 quotas exceeded des apis PE.
      trys++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else break;
  }

  if (jobResult.error) return jobResult;
  else return transformPeJobsForIdea(jobResult, radius, lat, long);
};

// update du contenu avec des résultats pertinents par rapport au rayon
const transformPeJobsForIdea = (jobs, radius, lat, long) => {
  let resultJobs = {
    results: [],
  };

  if (jobs.resultats && jobs.resultats.length) {
    for (let i = 0; i < jobs.resultats.length; ++i) {
      //console.log("jobs.resultat : ",jobs.resultats[i]);
      let job = transformPeJobForIdea(jobs.resultats[i], lat, long);

      if (job.place.distance < getRoundedRadius(radius)) {
        resultJobs.results.push(job);
      }
    }
  }

  return resultJobs;
};

// Adaptation au modèle Idea et conservation des seules infos utilisées des offres
const transformPeJobForIdea = (job, lat, long) => {
  let resultJob = itemModel("peJob");

  resultJob.title = job.intitule;

  //contact
  if (job.contact) {
    resultJob.contact = {};
    if (job.contact.nom) resultJob.contact.name = job.contact.nom;
    if (job.contact.courriel) resultJob.contact.email = job.contact.courriel;
    if (job.contact.coordonnees1)
      resultJob.contact.info = `${job.contact.coordonnees1}${
        job.contact.coordonnees2 ? "\n" + job.contact.coordonnees2 : ""
      }${job.contact.coordonnees3 ? "\n" + job.contact.coordonnees3 : ""}`;
  }

  resultJob.place = {
    distance: lat === null ? 0 : computeJobDistanceToSearchCenter(job, lat, long),
    insee: job.lieuTravail.commune,
    zipCode: job.lieuTravail.codePostal,
    city: job.lieuTravail.libelle,
    latitude: job.lieuTravail.latitude,
    longitude: job.lieuTravail.longitude,
    fullAddress: `${job.lieuTravail.libelle}${job.lieuTravail.codePostal ? " " + job.lieuTravail.codePostal : ""}`,
  };

  resultJob.company = {};

  if (job.entreprise) {
    if (job.entreprise.nom) resultJob.company.name = job.entreprise.nom;
    if (job.entreprise.logo) resultJob.company.logo = job.entreprise.logo;
    if (job.entreprise.description) resultJob.company.description = job.entreprise.description;
  }

  resultJob.url = `https://candidat.pole-emploi.fr/offres/recherche/detail/${job.id}`;

  resultJob.job = {
    id: job.id,
    creationDate: job.dateCreation,
    description: job.description,
    contractType: job.typeContrat,
    contractDescription: job.typeContratLibelle,
    duration: job.dureeTravailLibelle,
  };

  if (job.romeCode) {
    resultJob.romes = [
      {
        code: job.romeCode,
        label: job.appellationLibelle,
      },
    ];
  }

  return resultJob;
};

const computeJobDistanceToSearchCenter = (job, lat, long) => {
  // si la distance au centre du point de recherche n'est pas connue, on la calcule avec l'utilitaire distance de turf.js
  if (job.lieuTravail && job.lieuTravail.latitude && job.lieuTravail.longitude)
    return Math.round(10 * distance.default([long, lat], [job.lieuTravail.longitude, job.lieuTravail.latitude])) / 10;
  else return null;
};

const peJobsApiEndpoint = "https://api.emploi-store.fr/partenaire/offresdemploi/v2/offres/search";
const peJobApiEndpoint = "https://api.emploi-store.fr/partenaire/offresdemploi/v2/offres/";
const peContratsAlternances = "E2,FS"; //E2 -> Contrat d'Apprentissage, FS -> contrat de professionalisation

const getPeJobs = async (romes, insee, radius, limit) => {
  try {
    const token = await getAccessToken("pe");
    let headers = peApiHeaders;
    headers.Authorization = `Bearer ${token}`;

    // hack : les codes insee des villes à arrondissement retournent une erreur. il faut utiliser un code insee d'arrondissement
    let codeInsee = insee;
    if (insee === "75056") codeInsee = "75101";
    else if (insee === "13055") codeInsee = "13201";
    else if (insee === "69123") codeInsee = "69381";

    const distance = radius || 10;

    let params = {
      codeROME: romes,
      commune: codeInsee,
      distance,
      sort: 2,
      natureContrat: peContratsAlternances,
      range: `0-${limit - 1}`,
    };

    const jobs = await axios.get(`${peJobsApiEndpoint}`, {
      params,
      headers,
    });

    //throw new Error("boom");

    return jobs.data;
  } catch (error) {
    let errorObj = { result: "error", message: error.message };

    Sentry.captureException(error);

    if (error.response) {
      errorObj.status = error.response.status;
      errorObj.statusText = error.response.statusText;
    }

    console.log("error get PE Jobs", errorObj);

    return errorObj;
  }
};

const getPeJobFromId = async ({ id }) => {
  try {
    const token = await getAccessToken("pe");
    let headers = peApiHeaders;
    headers.Authorization = `Bearer ${token}`;

    const job = await axios.get(`${peJobApiEndpoint}${id}`, {
      headers,
    });

    //throw new Error("boom");

    if (job.status === 204 || job.status === 400) {
      return { result: "not_found", message: "Offre non trouvée" };
    } else {
      let peJob = transformPeJobForIdea(job.data, null, null);

      return { peJobs: [peJob] };
    }
  } catch (error) {
    let errorObj = { result: "error", message: error.message };

    Sentry.captureException(error);

    if (error.response) {
      errorObj.status = error.response.status;
      errorObj.statusText = error.response.statusText;
    }

    console.log("error get PE Job by id", errorObj);

    return errorObj;
  }
};

module.exports = { getSomePeJobs, getPeJobFromId };
