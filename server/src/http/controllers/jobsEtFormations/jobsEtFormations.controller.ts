import { zRoutes } from "shared/index.js"

import { trackApiCall } from "../../../common/utils/sendTrackingEvent.js"
import { getFormationsQuery } from "../../../services/formation.service.js"
import { getJobsFromApi } from "../../../services/jobOpportunity.service.js"
import { jobsEtFormationsQueryValidator } from "../../../services/queryValidator.service.js"
import { Server } from "../../server"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  // @Tags("Jobs et formations")
  // @OperationId("getJobsEtFormations")
  server.get(
    "/api/v1/jobsEtFormations",
    {
      schema: zRoutes.get["/api/v1/jobsEtFormations"],
      config,
      // TODO: AttachValidation Error ?
    },
    async (req, res) => {
      const { referer } = req.headers
      const { romes, rncp, caller, latitude, longitude, radius, insee, sources, diploma, opco, opcoUrl, options } = req.query
      const parameterControl = await jobsEtFormationsQueryValidator({
        romes,
        rncp,
        referer,
        caller,
        ...(latitude ? { latitude } : {}),
        ...(longitude ? { longitude } : {}),
        radius,
        insee,
        sources,
        diploma,
        opco,
        opcoUrl,
      })

      if ("error" in parameterControl) {
        if (parameterControl.error === "wrong_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }

        return res.send(parameterControl)
      }

      const itemSources = sources ? sources.split(",") : ["formations", "lba", "matcha", "offres"]
      const hasSomeApiTag = ["lba", "lbb", "offres", "matcha"].some((apiTag) => itemSources.includes(apiTag))

      const [formations, jobs] = await Promise.all([
        itemSources.includes("formations")
          ? getFormationsQuery({
              romes: parameterControl.romes,
              ...(latitude ? { latitude: latitude } : {}),
              ...(longitude ? { longitude: longitude } : {}),
              radius,
              diploma,
              caller,
              options,
              referer,
              api: "jobEtFormationV1",
            })
          : null,
        hasSomeApiTag
          ? getJobsFromApi({
              romes: parameterControl.romes,
              referer,
              caller,
              latitude,
              longitude,
              radius,
              insee,
              sources,
              diploma,
              opco,
              opcoUrl,
              api: "jobEtFormationV1",
            })
          : null,
      ])

      if (caller) {
        let job_count = 0
        if (jobs && "lbaCompanies" in jobs && jobs.lbaCompanies && "results" in jobs.lbaCompanies) {
          job_count += jobs.lbaCompanies.results.length
        }

        if (jobs && "peJobs" in jobs && jobs.peJobs && "results" in jobs.peJobs) {
          job_count += jobs.peJobs.results.length
        }

        if (jobs && "matchas" in jobs && jobs.matchas && "results" in jobs.matchas) {
          job_count += jobs.matchas.results.length
        }

        const training_count = formations && "results" in formations ? formations.results.length : 0

        trackApiCall({
          caller,
          api_path: "jobEtFormationV1",
          training_count,
          job_count,
          result_count: job_count + training_count,
          response: "OK",
        })
      }

      return res.send({ formations, jobs })
    }
  )
}
