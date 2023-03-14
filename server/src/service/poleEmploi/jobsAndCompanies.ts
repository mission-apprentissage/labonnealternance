// @ts-nocheck

import { trackApiCall } from "../../common/utils/sendTrackingEvent.js"
import { sentryCaptureException } from "../../common/utils/sentryUtils.js"
import { getMatchaJobs } from "../matcha.js"
import { getCompanyFromSiret, getSomeLbbCompanies } from "./bonnesBoites.js"
import { jobsQueryValidator } from "./jobsQueryValidator.js"
import { getPeJobFromId, getSomePeJobs } from "./offresPoleEmploi.js"

const getJobsQuery = async (query) => {
  const queryValidationResult = jobsQueryValidator(query)

  if (queryValidationResult.error) {
    return queryValidationResult
  }

  const result = await getJobsFromApi({ query, api: "jobV1/jobs" })

  if (query.caller) {
    let job_count = 0
    if (result?.lbaCompanies?.results) {
      job_count += result.lbaCompanies.results.length
    }

    if (result?.peJobs?.results) {
      job_count += result.peJobs.results.length
    }

    if (result?.matchas?.results) {
      job_count += result.matchas.results.length
    }

    trackApiCall({ caller: query.caller, job_count, result_count: job_count, api_path: "jobV1/jobs", response: "OK" })
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
      trackApiCall({ caller: query.caller, job_count: 1, result_count: 1, api_path: "jobV1/job", response: "OK" })
    }
    //throw new Error("BIG BANG");
    return job
  } catch (err) {
    sentryCaptureException(err)
    if (query.caller) {
      trackApiCall({ caller: query.caller, api_path: "jobV1/job", response: "Error" })
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
      trackApiCall({ caller: query.caller, api_path: "jobV1/company", job_count: 1, result_count: 1, response: "OK" })
    }

    return company
  } catch (err) {
    console.error("Error ", err.message)
    sentryCaptureException(err)
    if (query.caller) {
      trackApiCall({ caller: query.caller, api_path: "jobV1/company", response: "Error" })
    }
    return { error: "internal_error" }
  }
}

const getJobsFromApi = async ({ query, api }) => {
  try {
    const sources = !query.sources ? ["lba", "lbb", "offres", "matcha"] : query.sources.split(",")

    const [peJobs, lbaCompanies, lbbCompanies, matchas] = await Promise.all([
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
    sentryCaptureException(err)

    if (query.caller) {
      trackApiCall({ caller: query.caller, api_path: api, response: "Error" })
    }

    return { error: "internal_error" }
  }
}

const deduplicateCompanies = (lbaCompanies, lbbCompanies) => {
  if (lbaCompanies.results && lbbCompanies.results) {
    const lbaSirets = []
    for (let i = 0; i < lbaCompanies.results.length; ++i) {
      lbaSirets.push(lbaCompanies.results[i].company.siret)
    }

    const deduplicatedLbbCompanies = []
    for (let i = 0; i < lbbCompanies.results.length; ++i) {
      if (lbaSirets.indexOf(lbbCompanies.results[i].company.siret) < 0) deduplicatedLbbCompanies.push(lbbCompanies.results[i])
    }
    lbbCompanies.results = deduplicatedLbbCompanies
  }
}

export { getJobsFromApi, getJobsQuery, getPeJobQuery, getCompanyQuery }
