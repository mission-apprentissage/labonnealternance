import { IEligibleTrainingsForAppointmentSchema } from "shared/models/elligibleTraining.model"

import { z } from "../helpers/zodWithOpenApi"

import { IRoutesDef } from "./common.routes"

export const zCampaignWebhookRoutes = {
  get: {
    "/api/partners/parcoursup/formations": {
      response: {
        "200": z.array(z.object({ parcoursup_id: Pick<IEligibleTrainingsForAppointmentSchema, "parcoursup_id"> })),
      },
    },
  },
  post: {},
  put: {},
  delete: {},
  patch: {},
} satisfies IRoutesDef
