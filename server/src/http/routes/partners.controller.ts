import { zRoutes } from "shared"
import { referrers } from "shared/constants/referers"

import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service"
import { Server } from "../server"

/**
 * @description Partners server.
 */
export default (server: Server) => {
  /**
   * @description Returns all available parcoursup ids.
   * This endpoint is used by Parcoursup.
   */
  server.get(
    "/api/partners/parcoursup/formations",
    {
      schema: zRoutes.get["/api/partners/parcoursup/formations"],
    },
    async (req, res) => {
      const ids = await eligibleTrainingsForAppointmentService.find(
        {
          parcoursup_id: {
            $ne: null,
          },
          referrers: { $in: [referrers.PARCOURSUP.name] },
        },
        { parcoursup_id: 1 }
      )

      return res.send({ ids: ids.map((eligibleTrainingsForAppointment) => eligibleTrainingsForAppointment.parcoursup_id) })
    }
  )
}
