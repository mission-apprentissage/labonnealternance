import { zRoutes } from "shared"
import { LBA_ITEM_TYPE, allLbaItemType } from "shared/constants/lbaitem"

import { trackApiCall } from "../../common/utils/sendTrackingEvent"
import { getFormationsQuery } from "../../services/formation.service"
import { getJobsFromApi } from "../../services/jobs/jobOpportunity/jobOpportunity.service"
import { jobsEtFormationsQueryValidator } from "../../services/queryValidator.service"
import { Server } from "../server"

const config = {
  rateLimit: {
    max: 5,
    timeWindow: "1s",
  },
}

export default (server: Server) => {
  server.get(
    "/jobsEtFormations",
    {
      schema: zRoutes.get["/jobsEtFormations"],
      onRequest: server.auth(zRoutes.get["/jobsEtFormations"]),
      config,
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

      const itemSources = sources ? sources.split(",") : allLbaItemType
      const hasSomeApiTag = allLbaItemType.filter((x) => x !== LBA_ITEM_TYPE.FORMATION).some((apiTag) => itemSources.includes(apiTag))

      const [formations, jobs] = await Promise.all([
        itemSources.includes(LBA_ITEM_TYPE.FORMATION)
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
              isMinimalData: false,
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
              isMinimalData: false,
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

      return res.status(200).send({ formations, jobs })
    }
  )
}
