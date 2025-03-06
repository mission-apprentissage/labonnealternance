import { z } from "zod"

import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { ZJobsPartnersOfferPrivate } from "../models/jobsPartners.model.js"

import { IRoutesDef } from "./common.routes.js"

export const ZLbaCompanyForContactUpdate = z.object({
  siret: z.string().describe("Le Siret de la société"), // use extension.siret
  enseigne: z.string().nullish().describe("Enseigne de l'entreprise"),
  email: z.string().nullish().describe("Adresse email de contact"),
  phone: extensions.phone().nullish().describe("Numéro de téléphone de contact"),
  active: z.boolean().describe("société présente dans recruteurslba ou non"),
})
export type ILbaCompanyForContactUpdate = z.output<typeof ZLbaCompanyForContactUpdate>

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
