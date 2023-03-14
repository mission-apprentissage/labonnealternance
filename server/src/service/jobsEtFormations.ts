// @ts-nocheck

import { trackApiCall } from "../common/utils/sendTrackingEvent.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"
import { deduplicateFormations, getFormations, transformFormationsForIdea } from "./formations.js"
import { jobsEtFormationsQueryValidator } from "./jobsEtFormationsQueryValidator.js"
import { getJobsFromApi } from "./poleEmploi/jobsAndCompanies.js"

const getJobsEtFormationsQuery = async (query) => {
  const queryValidationResult = jobsEtFormationsQueryValidator(query)

  if (queryValidationResult.error) return queryValidationResult

  try {
    const sources = !query.sources ? ["formations", "lba", "lbb", "offres"] : query.sources.split(",")

    let [formations, jobs] = await Promise.all([
      sources.indexOf("formations") >= 0
        ? getFormations({
            romes: query.romes ? query.romes.split(",") : null,
            rncps: query.rncps ? query.rncps.split(",") : null,
            coords: query.longitude || query.longitude ? [query.longitude, query.latitude] : null,
            radius: query.radius,
            diploma: query.diploma,
            limit: 150,
            romeDomain: query.romeDomain,
            caller: query.caller,
            api: "jobEtFormationV1",
            useMock: query.useMock,
          })
        : null,
      sources.indexOf("lba") >= 0 || sources.indexOf("lbb") >= 0 || sources.indexOf("offres") >= 0 || sources.indexOf("matcha") >= 0
        ? getJobsFromApi({ query, api: "jobEtFormationV1" })
        : null,
    ])

    if (formations && formations?.result !== "error") {
      formations = deduplicateFormations(formations)
      formations = transformFormationsForIdea(formations)
    }

    if (query.caller) {
      let job_count = 0
      if (jobs?.lbaCompanies?.results) {
        job_count += jobs.lbaCompanies.results.length
      }

      if (jobs?.peJobs?.results) {
        job_count += jobs.peJobs.results.length
      }

      if (jobs?.matchas?.results) {
        job_count += jobs.matchas.results.length
      }

      const training_count = formations?.results ? formations.results.length : 0

      trackApiCall({
        caller: query.caller,
        api_path: "jobEtFormationV1",
        training_count,
        job_count,
        result_count: job_count + training_count,
        response: "OK",
      })
    }

    return { formations, jobs }
  } catch (err) {
    console.log("Error ", err.message)
    sentryCaptureException(err)

    if (query.caller) {
      trackApiCall({ caller: query.caller, api_path: "jobEtFormationV1", response: "Error" })
    }

    return { error: "internal_error" }
  }
}

export { getJobsEtFormationsQuery }
