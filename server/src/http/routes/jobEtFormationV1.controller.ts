//@ts-nocheck
import express from "express"

import { trackApiCall } from "../../common/utils/sendTrackingEvent"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { jobsEtFormationsQueryValidator } from "../../service/jobsEtFormationsQueryValidator"
import { getJobsFromApi } from "../../service/poleEmploi/jobsAndCompanies"
import { getFormationsQuery } from "../../services/formation.service"
import { tryCatch } from "../middlewares/tryCatchMiddleware"

export default function () {
  const router = express.Router()

  router.get(
    "/",
    tryCatch(async (req: express.Request, res) => {
      const query = { ...req.query, referer: req.headers.referer }
      let result = await jobsEtFormationsQueryValidator(query)

      // TODO: use Joi control when moving this part to TSOA controller
      if (!result.error) {
        try {
          const sources = !query.sources ? ["formations", "lba", "lbb", "offres"] : query.sources.split(",")

          const [formations, jobs] = await Promise.all([
            sources.indexOf("formations") >= 0
              ? getFormationsQuery({
                  romes: query.romes,
                  coords: query.longitude ? [query.longitude, query.latitude] : null,
                  radius: query.radius,
                  diploma: query.diploma,
                  limit: 150,
                  romeDomain: query.romeDomain,
                  caller: query.caller,
                  api: "jobEtFormationV1",
                  options: query.options,
                  useMock: query.useMock,
                })
              : null,
            sources.indexOf("lba") >= 0 || sources.indexOf("lbb") >= 0 || sources.indexOf("offres") >= 0 || sources.indexOf("matcha") >= 0
              ? getJobsFromApi({ query, api: "jobEtFormationV1" })
              : null,
          ])

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

          result = { formations, jobs }
        } catch (err) {
          console.error("Error ", err.message)
          sentryCaptureException(err)

          if (query.caller) {
            trackApiCall({ caller: query.caller, api_path: "jobEtFormationV1", response: "Error" })
          }

          result = { error: "internal_error" }
        }
      }

      if (result.error) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }
      }

      return res.json(result)
    })
  )

  return router
}
