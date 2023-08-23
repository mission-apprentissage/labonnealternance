// @ts-nocheck

import { RncpRomes } from "../../common/model/index.js"
import { trackApiCall } from "../../common/utils/sendTrackingEvent.js"
import { sentryCaptureException } from "../../common/utils/sentryUtils.js"
import { getLbaJobs } from "../../services/lbajob.service.js"
import { getSomeLbbCompanies } from "./bonnesBoites.js"
import { jobsQueryValidator } from "./jobsQueryValidator.js"
import { getSomePeJobs } from "../../services/pejob.service.js"

export type JobSearchQuery = {
  romes?: string
  rncp?: string
  referer?: string
  caller?: string
  latitude?: string
  longitude?: string
  radius?: number
  insee?: string
  sources?: string
  diploma?: string
  opco?: string
  opcoUrl?: string
  useMock?: string
}

const getJobsQuery = async (query: JobSearchQuery) => {
  const queryValidationResult = await jobsQueryValidator(query)

  if ("error" in queryValidationResult) {
    return queryValidationResult
  }

  const result = await getJobsFromApi({ query, api: "jobV1/jobs" })

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
  if (query.caller) {
    trackApiCall({ caller: query.caller, job_count, result_count: job_count, api_path: "jobV1/jobs", response: "OK" })
  }

  return { ...result, job_count }
}

const getJobsFromApi = async ({ query, api }) => {
  try {
    const sources = !query.sources ? ["lba", "lbb", "offres", "matcha"] : query.sources.split(",")

    const { caller, diploma, insee, latitude, longitude, opco, opcoUrl, radius, referer, romes, useMock } = query

    const [peJobs, lbaCompanies, lbbCompanies, matchas] = await Promise.all([
      sources.indexOf("offres") >= 0
        ? getSomePeJobs({
            romes: romes.split(","),
            insee: insee,
            radius: parseInt(radius),
            latitude,
            longitude,
            caller,
            diploma,
            api,
            opco,
            opcoUrl,
          })
        : null,
      sources.indexOf("lba") >= 0
        ? getSomeLbbCompanies({
            romes,
            latitude: query.latitude,
            longitude: query.longitude,
            radius: parseInt(query.radius),
            type: "lba",
            referer,
            caller,
            api,
            opco,
            opcoUrl,
            useMock,
          })
        : null,
      sources.indexOf("lbb") >= 0
        ? getSomeLbbCompanies({
            romes,
            latitude,
            longitude,
            radius: parseInt(radius),
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
        ? getLbaJobs({
            romes,
            latitude,
            longitude,
            radius: parseInt(radius),
            api,
            caller,
            diploma,
            opco,
            opcoUrl,
            useMock,
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
