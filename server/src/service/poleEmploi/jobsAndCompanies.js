const Sentry = require("@sentry/node");

const offresPoleEmploi = require("./offresPoleEmploi");
const bonnnesBoites = require("./bonnesBoites");
const matcha = require("../matcha");
const { jobsQueryValidator } = require("./jobsQueryValidator");
const { trackEvent } = require("../../common/utils/sendTrackingEvent");

const getJobsQuery = async (query) => {
  const queryValidationResult = jobsQueryValidator(query);

  if (queryValidationResult.error) return queryValidationResult;

  if (query.caller) {
    trackEvent({ category: "Appel API", action: "jobV1", label: query.caller });
  }

  return getJobsFromApi(query);
};

const getPeJobQuery = async (query) => {
  if (query.caller) {
    trackEvent({ category: "Appel API", action: "loadPeJobV1", label: query.caller });
  }

  try {
    const job = await offresPoleEmploi.getPeJobFromId({
      id: query.id,
    });

    //throw new Error("BIG BANG");
    return job;
  } catch (err) {
    console.error("Error ", err.message);
    Sentry.captureException(err);
    return { error: "internal_error" };
  }
};

const getCompanyQuery = async (query) => {
  if (query.caller) {
    trackEvent({ category: "Appel API", action: "loadCompanyV1", label: query.caller });
  }

  try {
    const company = await bonnnesBoites.getCompanyFromSiret({
      siret: query.siret,
      referer: query.referer,
      type: query.type,
    });

    //throw new Error("BIG BANG");
    return company;
  } catch (err) {
    console.error("Error ", err.message);
    Sentry.captureException(err);
    return { error: "internal_error" };
  }
};

const getJobsFromApi = async (query) => {
  try {
    const sources = !query.sources ? ["lba", /*"lbb",*/ "offres", "matcha"] : query.sources.split(",");

    let [peJobs, lbaCompanies, lbbCompanies, matchas] = await Promise.all([
      sources.indexOf("offres") >= 0
        ? offresPoleEmploi.getSomePeJobs({
            romes: query.romes.split(","),
            insee: query.insee,
            radius: parseInt(query.radius),
            lat: query.latitude,
            long: query.longitude,
            strictRadius: query.strictRadius,
          })
        : null,
      sources.indexOf("lba") >= 0
        ? bonnnesBoites.getSomeLbbCompanies({
            romes: query.romes,
            latitude: query.latitude,
            longitude: query.longitude,
            radius: parseInt(query.radius),
            type: "lba",
            strictRadius: query.strictRadius,
            referer: query.referer,
          })
        : null,
      sources.indexOf("lbb") >= 0
        ? bonnnesBoites.getSomeLbbCompanies({
            romes: query.romes,
            latitude: query.latitude,
            longitude: query.longitude,
            radius: parseInt(query.radius),
            type: "lbb",
            strictRadius: query.strictRadius,
            referer: query.referer,
          })
        : null,
      sources.indexOf("matcha") >= 0
        ? matcha.getMatchaJobs({
            romes: query.romes,
            latitude: query.latitude,
            longitude: query.longitude,
            radius: parseInt(query.radius),
          })
        : null,
    ]);

    //remove duplicates between lbas and lbbs. lbas stay untouched, only duplicate lbbs are removed
    if (lbaCompanies && lbbCompanies) deduplicateCompanies(lbaCompanies, lbbCompanies);

    if (!query.sources) {
      lbbCompanies = { results: [] };
    }
    //throw new Error("kaboom");

    return { peJobs, matchas, lbaCompanies, lbbCompanies };
  } catch (err) {
    console.log("Error ", err.message);
    Sentry.captureException(err);
    return { error: "internal_error" };
  }
};

const deduplicateCompanies = (lbaCompanies, lbbCompanies) => {
  if (lbaCompanies.results && lbbCompanies.results) {
    let lbaSirets = [];
    for (let i = 0; i < lbaCompanies.results.length; ++i) {
      lbaSirets.push(lbaCompanies.results[i].company.siret);
    }

    let deduplicatedLbbCompanies = [];
    for (let i = 0; i < lbbCompanies.results.length; ++i) {
      if (lbaSirets.indexOf(lbbCompanies.results[i].company.siret) < 0)
        deduplicatedLbbCompanies.push(lbbCompanies.results[i]);
    }
    lbbCompanies.results = deduplicatedLbbCompanies;
  }
};

module.exports = { getJobsFromApi, getJobsQuery, getPeJobQuery, getCompanyQuery };
