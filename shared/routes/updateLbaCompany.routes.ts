import { literal, z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives"
import { ZLbaCompany } from "../models/lbaCompany.model"

export const zUpdateLbaCompanyRoutes = {
  get: {
    "/api/updateLBB/updateContactInfo": {
      queryString: z
        .object({
          secret: z.string(),
          email: z.string().email().or(z.literal("")),
          phone: extensions.phone().or(literal("")),
          siret: extensions.siret(),
        })
        .strict(),
      response: {
        "200": ZLbaCompany,
      },
    },
  },
  post: {},
  put: {},
  delete: {},
}
