import Sentry from "@sentry/node"

import { getPeJobFromId, getSomePeJobs } from "./offresPoleEmploi.js"
import { getCompanyFromSiret, getSomeLbbCompanies } from "./bonnesBoites.js"
import { getMatchaJobs } from "../matcha.js"
import { jobsQueryValidator } from "./jobsQueryValidator.js"
import { trackApiCall } from "../../common/utils/sendTrackingEvent.js"

const getJobsQuery = async (query) => {
  const queryValidationResult = jobsQueryValidator(query)

  if (queryValidationResult.error) {
    return queryValidationResult
  }

  const result = await getJobsFromApi({ query, api: "jobV1/jobs" })

  if (query.caller) {
    let nb_emplois = 0
    if (result?.lbaCompanies?.results) {
      nb_emplois += result.lbaCompanies.results.length
    }

    if (result?.peJobs?.results) {
      nb_emplois += result.peJobs.results.length
    }

    if (result?.matchas?.results) {
      nb_emplois += result.matchas.results.length
    }

    trackApiCall({ caller: query.caller, nb_emplois, result_count: nb_emplois, api: "jobV1/jobs", result: "OK" })
  }

  return result
}

const getPeJobQuery = async (query) => {
  try {
    const job = await getPeJobFromId({
      id: query.id,
      caller: query.caller,
    })

    if (query.caller) {
      trackApiCall({ caller: query.caller, nb_emplois: 1, result_count: 1, api: "jobV1/job", result: "OK" })
    }
    //throw new Error("BIG BANG");
    return job
  } catch (err) {
    Sentry.captureException(err)
    if (query.caller) {
      trackApiCall({ caller: query.caller, api: "jobV1/job", result: "Error" })
    }
    return { error: "internal_error" }
  }
}

const getCompanyQuery = async (query) => {
  try {
    const company = await getCompanyFromSiret({
      siret: query.siret,
      referer: query.referer,
      type: query.type,
      caller: query.caller,
    })

    //throw new Error("BIG BANG");
    if (query.caller) {
      trackApiCall({ caller: query.caller, api: "jobV1/company", nb_emplois: 1, result_count: 1, result: "OK" })
    }

    return company
  } catch (err) {
    console.error("Error ", err.message)
    Sentry.captureException(err)
    if (query.caller) {
      trackApiCall({ caller: query.caller, api: "jobV1/company", result: "Error" })
    }
    return { error: "internal_error" }
  }
}

const getJobsFromApi = async ({ query, api }) => {
  try {
    const sources = !query.sources ? ["lba", "lbb", "offres", "matcha"] : query.sources.split(",")

    let [peJobs, lbaCompanies, lbbCompanies, matchas] = await Promise.all([
      sources.indexOf("offres") >= 0
        ? getSomePeJobs({
            romes: query.romes.split(","),
            insee: query.insee,
            radius: parseInt(query.radius),
            lat: query.latitude,
            long: query.longitude,
            caller: query.caller,
            api,
            opco: query.opco,
          })
        : null,
      sources.indexOf("lba") >= 0
        ? getSomeLbbCompanies({
            romes: query.romes,
            latitude: query.latitude,
            longitude: query.longitude,
            radius: parseInt(query.radius),
            type: "lba",
            referer: query.referer,
            caller: query.caller,
            api,
            opco: query.opco,
            useMock: query.useMock,
          })
        : null,
      sources.indexOf("lbb") >= 0
        ? getSomeLbbCompanies({
            romes: query.romes,
            latitude: query.latitude,
            longitude: query.longitude,
            radius: parseInt(query.radius),
            type: "lbb",
            referer: query.referer,
            caller: query.caller,
            api,
            opco: query.opco,
            useMock: query.useMock,
          })
        : null,
      sources.indexOf("matcha") >= 0
        ? getMatchaJobs({
            romes: query.romes,
            latitude: query.latitude,
            longitude: query.longitude,
            radius: parseInt(query.radius),
            api,
            caller: query.caller,
            opco: query.opco,
            useMock: query.useMock,
          })
        : null,
    ])

    //remove duplicates between lbas and lbbs. lbas stay untouched, only duplicate lbbs are removed
    if (lbaCompanies && lbbCompanies) {
      deduplicateCompanies(lbaCompanies, lbbCompanies)
    }

    /*if (!query.sources) {
      lbbCompanies = { results: [] };
    }*/
    //throw new Error("kaboom");

    return { peJobs, matchas, lbaCompanies, lbbCompanies }
  } catch (err) {
    console.log("Error ", err.message)
    Sentry.captureException(err)

    if (query.caller) {
      trackApiCall({ caller: query.caller, api, result: "Error" })
    }

    return { error: "internal_error" }
  }
}

const deduplicateCompanies = (lbaCompanies, lbbCompanies) => {
  if (lbaCompanies.results && lbbCompanies.results) {
    let lbaSirets = []
    for (let i = 0; i < lbaCompanies.results.length; ++i) {
      lbaSirets.push(lbaCompanies.results[i].company.siret)
    }

    let deduplicatedLbbCompanies = []
    for (let i = 0; i < lbbCompanies.results.length; ++i) {
      if (lbaSirets.indexOf(lbbCompanies.results[i].company.siret) < 0) deduplicatedLbbCompanies.push(lbbCompanies.results[i])
    }
    lbbCompanies.results = deduplicatedLbbCompanies
  }
}

export { getJobsFromApi, getJobsQuery, getPeJobQuery, getCompanyQuery }
