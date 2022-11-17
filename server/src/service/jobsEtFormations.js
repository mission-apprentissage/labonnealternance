import Sentry from "@sentry/node"

import { getFormations, transformFormationsForIdea, deduplicateFormations } from "./formations.js"
import { getJobsFromApi } from "./poleEmploi/jobsAndCompanies.js"
import { jobsEtFormationsQueryValidator } from "./jobsEtFormationsQueryValidator.js"
import { trackApiCall } from "../common/utils/sendTrackingEvent.js"

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
      let nb_emplois = 0
      if (jobs?.lbaCompanies?.results) {
        nb_emplois += jobs.lbaCompanies.results.length
      }

      if (jobs?.peJobs?.results) {
        nb_emplois += jobs.peJobs.results.length
      }

      if (jobs?.matchas?.results) {
        nb_emplois += jobs.matchas.results.length
      }

      const nb_formations = formations?.results ? formations.results.length : 0

      trackApiCall({
        caller: query.caller,
        api: "jobEtFormationV1",
        nb_formations,
        nb_emplois,
        result_count: nb_emplois + nb_formations,
        result: "OK",
      })
    }

    return { formations, jobs }
  } catch (err) {
    console.log("Error ", err.message)
    Sentry.captureException(err)

    if (query.caller) {
      trackApiCall({ caller: query.caller, api: "jobEtFormationV1", result: "Error" })
    }

    return { error: "internal_error" }
  }
}

export { getJobsEtFormationsQuery }
