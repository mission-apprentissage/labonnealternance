import { zRoutes } from "shared/index.js"

import { ServerBuilder } from "@/http/utils/serverBuilder.js"

import { trackApiCall } from "../../../common/utils/sendTrackingEvent.js"
import { getFormationsParRegionQuery } from "../../../services/formation.service.js"

export default (server: ServerBuilder) => {
  server.get(
    {
      schema: zRoutes.get["/v1/formationsParRegion"],
      // TODO: AttachValidation Error ?
      attachValidation: true,
    },
    async (req, res) => {
      const { romes, romeDomain, caller, departement, region, diploma, options } = req.query
      const { referer } = req.headers

      const result = await getFormationsParRegionQuery({ romes, departement, region, diploma, romeDomain, caller, options, referer })

      if ("error" in result) {
        if (result.error === "wrong_parameters") {
          res.status(400)
        } else {
          res.status(500)
        }

        return result
      }

      if (caller) {
        trackApiCall({
          caller: caller,
          api_path: "formationRegionV1",
          training_count: result.results.length,
          result_count: result.results.length,
          response: "OK",
        })
      }

      return result
    }
  )
}
