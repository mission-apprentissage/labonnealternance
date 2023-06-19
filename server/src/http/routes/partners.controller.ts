import express from "express"
import { tryCatch } from "../middlewares/tryCatchMiddleware.js"
import { referrers } from "../../common/model/constants/referrers.js"
import * as eligibleTrainingsForAppointmentService from "../../services/eligibleTrainingsForAppointment.service.js"

/**
 * @description Partners router.
 */
export default () => {
  const router = express.Router()

  /**
   * @description Returns all available parcoursup ids.
   * This endpoint is used by Parcoursup.
   */
  router.get(
    "/parcoursup/formations",
    tryCatch(async (req, res) => {
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
    })
  )

  return router
}
