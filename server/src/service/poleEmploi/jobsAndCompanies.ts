// @ts-nocheck

import { trackApiCall } from "../../common/utils/sendTrackingEvent.js"
import { sentryCaptureException } from "../../common/utils/sentryUtils.js"
import { getMatchaJobs } from "../matcha.js"
import { jobsQueryValidator } from "./jobsQueryValidator.js"

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
            diploma: query.diploma,
            api,
            opco: query.opco,
            opcoUrl: query.opcoUrl,
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
            opcoUrl: query.opcoUrl,
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
            opcoUrl: query.opcoUrl,
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
            diploma: query.diploma,
            opco: query.opco,
            opcoUrl: query.opcoUrl,
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

export { getJobsFromApi, getJobsQuery }
