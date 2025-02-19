import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { ZJobsPartnersOfferPrivate } from "../models/jobsPartners.model.js"
import { ZLbaCompanyForContactUpdate } from "../models/recruteurLba.model.js"

import { IRoutesDef } from "./common.routes.js"

export const zUpdateLbaCompanyRoutes = {
  get: {
    "/lbacompany/:siret/contactInfo": {
      method: "get",
      path: "/lbacompany/:siret/contactInfo",
      params: z
        .object({
          siret: extensions.siret,
        })
        .strict(),
      response: {
        "200": ZLbaCompanyForContactUpdate,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },

  put: {
    "/lbacompany/:siret/contactInfo": {
      method: "put",
      path: "/lbacompany/:siret/contactInfo",
      params: z
        .object({
          siret: extensions.siret,
        })
        .strict(),
      body: z.object({
        email: ZJobsPartnersOfferPrivate.shape.apply_email,
        phone: ZJobsPartnersOfferPrivate.shape.apply_phone,
      }),
      response: {
        "200": ZLbaCompanyForContactUpdate,
      },
      securityScheme: {
        auth: "cookie-session",
        access: "admin",
        resources: {},
      },
    },
  },
} as const satisfies IRoutesDef
